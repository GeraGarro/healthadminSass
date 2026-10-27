package ar.com.salud.communication;

import ar.com.salud.shared.*;
import ar.com.salud.audit.Audit;
import ar.com.salud.scheduling.BookingService;
import ar.com.salud.identity.SecretBox;
import java.time.Instant;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Component
public class NotificationWorker {
    private static final Logger log=LoggerFactory.getLogger(NotificationWorker.class);
    private final Db db; private final TenantTransactions tx; private final BookingService booking;
    private final Audit audit; private final DeliveryGateway gateway; private final SecretBox secrets; private final TransactionTemplate global;
    private final String portal; private final boolean enabled;
    public NotificationWorker(Db db,TenantTransactions tx,BookingService booking,Audit audit,DeliveryGateway gateway,SecretBox secrets,
        PlatformTransactionManager manager,@Value("${app.portal-url}") String portal,@Value("${app.worker.enabled:true}") boolean enabled) {
        this.db=db;this.tx=tx;this.booking=booking;this.audit=audit;this.gateway=gateway;this.secrets=secrets;this.global=new TransactionTemplate(manager);this.portal=portal;this.enabled=enabled;
    }
    record Dispatch(UUID aviso,UUID task,Map<String,Object> payload) {}
    @Scheduled(fixedDelayString="${app.worker.delay-ms:15000}") public void tick() {
        if(!enabled) return;
        try { identityTick(); } catch(Exception e) { log.warn("Cola de identidad no disponible ({})",e.getClass().getSimpleName()); }
        for(var tenant:db.list("select id from entidad where estado='ACTIVA' order by id")) {
            try { processTenant(Db.uuid(tenant,"id")); }
            catch(Exception e) { log.warn("Cola de avisos no disponible ({})",e.getClass().getSimpleName()); }
        }
    }
    public void processTenant(UUID tenant) {
        for(int n=0;n<30;n++) {
            UUID task=tx.system(tenant,() -> {
                var due=db.list("select id from tarea_persistida where ((estado in ('PENDIENTE','REINTENTO') and programada_en<=now()) or (estado='EJECUTANDO' and bloqueada_hasta<now())) and intentos<5 order by programada_en,id for update skip locked limit 1");
                if(due.isEmpty()) return null;
                UUID id=Db.uuid(due.getFirst(),"id");
                db.update("update tarea_persistida set estado='EJECUTANDO',intentos=intentos+1,bloqueada_hasta=now()+interval '2 minutes' where id=?",id);return id;
            });
            if(task==null) break;
            try {
                List<Dispatch> sends=tx.system(tenant,() -> prepare(tenant,task));
                for(var send:sends) {
                    gateway.send(send.aviso().toString(),send.payload());
                    tx.system(tenant,() -> {
                        String state=gateway.simulated()?"SIMULADO":"ACEPTADO";
                        db.update("update aviso_externo set estado=? where id=?",state,send.aviso());
                        db.update("update intento_envio set estado=? where aviso_id=? and estado='INICIADO'",state,send.aviso());return null;
                    });
                }
                tx.system(tenant,() -> {
                    db.update("update tarea_persistida set estado=?,bloqueada_hasta=null where id=? and estado='EJECUTANDO'",gateway.simulated()?"SIMULADA":"COMPLETA",task);
                    db.update("update turno_afectado set estado_aviso=? where id=(select turno_afectado_id from tarea_persistida where id=?) and estado_aviso='PENDIENTE'",gateway.simulated()?"SIMULADO":"ACEPTADO",task);
                    return null; });
            } catch(Exception e) {
                tx.system(tenant,() -> {
                    db.update("update tarea_persistida set estado=case when intentos>=5 then 'REVISION' else 'REINTENTO' end,ultimo_error='DELIVERY_OR_CONFIGURATION_FAILURE',programada_en=now()+interval '5 minutes',bloqueada_hasta=null where id=?",task);
                    var t=db.one("select * from tarea_persistida where id=?",task);
                    if(((Number)t.get("intentos")).intValue()>=5) internal(tenant,task,Db.uuid(t,"version_turno_id"),"DELIVERY_FAILED");
                    return null; });
            }
        }
        tx.system(tenant,() -> {
            db.update("update pre_reserva set estado='EXPIRADA' where estado='ACTIVA' and vence_en<=now()");return null;
        });
    }
    private List<Dispatch> prepare(UUID tenant,UUID task) {
        var t=db.one("select * from tarea_persistida where id=? for update",task);
        var versions=db.list("select v.*,t.estado_turno,t.estado_asistencia,t.id turno_id,pp.paciente_id from version_turno v join turno t on t.id=v.turno_id and t.tenant_id=v.tenant_id join paciente_profesional pp on pp.id=t.paciente_profesional_id and pp.tenant_id=t.tenant_id where v.id=? and v.sustituida_en is null for update of t",t.get("version_turno_id"));
        boolean cancellation=String.valueOf(t.get("tipo")).startsWith("CANCELLED_PERIOD_");
        if(versions.isEmpty() || !("REGISTRADO".equals(versions.getFirst().get("estado_turno"))||cancellation&&"CANCELADO".equals(versions.getFirst().get("estado_turno")))) { state(task,"OBSOLETA");return List.of(); }
        var v=versions.getFirst(); String type=(String)t.get("tipo");
        boolean absence="ABSENCE_WHATSAPP".equals(type);
        if("ASSISTED_REVIEW".equals(type)) { internal(tenant,task,Db.uuid(v,"id"),type);state(task,"REVISION");return List.of(); }
        if(!absence && !cancellation && "CONFIRMADA".equals(v.get("estado_asistencia"))) { state(task,"OBSOLETA");return List.of(); }
        if("CLOSE_UNCONFIRMED".equals(type)) {
            Instant cutoff=Db.instant(v,"inicio_atencion").minusSeconds(24*3600L);
            boolean recent=!cutoff.isAfter(Instant.now()) && cutoff.isAfter(Instant.now().minusSeconds(900));
            boolean delivered=db.exists("select 1 from aviso_externo a join tarea_persistida j on j.id=a.tarea_id and j.tenant_id=a.tenant_id where j.version_turno_id=? and a.estado='ENTREGADO'",v.get("id"));
            if(Boolean.TRUE.equals(booking.policy().get("automatic_close")) && recent && delivered) {
                db.update("update turno set estado_turno='CANCELADO',version_concurrencia=version_concurrencia+1 where id=?",v.get("turno_id"));
                db.jdbc.queryForObject("select change_capacity(?,'RELEASE')",Boolean.class,v.get("ocupacion_id"));
                booking.event(tenant,null,Db.uuid(v,"turno_id"),Db.uuid(v,"id"),"CANCELADO_T24",null);
                internal(tenant,task,Db.uuid(v,"id"),"CANCELLED_T24");state(task,"COMPLETA");
            } else { internal(tenant,task,Db.uuid(v,"id"),"CLOSE_REQUIRES_REVIEW");state(task,"REVISION"); }
            return List.of();
        }
        // Un worker tardío no envía un aviso de confirmación fuera de su ventana.
        Instant start=Db.instant(v,"inicio_atencion");
        if(!absence && !cancellation && (("CONFIRMATION_EMAIL".equals(type) && !start.minusSeconds(48*3600L).isAfter(Instant.now())) || !start.minusSeconds(24*3600L).isAfter(Instant.now()))) {
            internal(tenant,task,Db.uuid(v,"id"),"LATE_NOTIFICATION");state(task,"REVISION");return List.of();
        }
        String channel="CONFIRMATION_EMAIL".equals(type)||type.endsWith("_EMAIL")?"EMAIL":"WHATSAPP";
        var destinations=db.list("""
            select d.id,d.canal,c.valor,ce.id canal_id,ce.remitente,ce.cuenta_externa from destino_aviso d
            join contacto_paciente c on c.id=d.contacto_id and c.tenant_id=d.tenant_id
            join canal_entidad ce on ce.tenant_id=d.tenant_id and ce.canal=d.canal
            where d.paciente_id=? and d.canal=? and d.proposito='TURNOS' and d.desde<=now()
            and (d.hasta is null or d.hasta>now()) and d.revocado_en is null and c.estado='ACTIVO'
            and c.verificado_en is not null and ce.estado='ACTIVO' and ce.verificada_en is not null
            and (d.representacion_id is null or exists(select 1 from representacion r where r.id=d.representacion_id and r.paciente_id=d.paciente_id and r.revocada_en is null and r.desde<=now() and (r.hasta is null or r.hasta>now())))
            """,v.get("paciente_id"),channel);
        if(destinations.isEmpty()) throw new IllegalStateException("No authorized destination/channel");
        var result=new ArrayList<Dispatch>();
        for(var d:destinations) {
            UUID aviso=db.id("insert into aviso_externo(tenant_id,tarea_id,destino_id,canal_id,clave_logica,plantilla_version_ref,estado,creado_en) values (?,?,?,?,?,'v1','PENDIENTE',now()) on conflict(tenant_id,clave_logica) do update set clave_logica=excluded.clave_logica returning id",tenant,task,d.get("id"),d.get("canal_id"),task+":"+d.get("id"));
            if(db.exists("select 1 from aviso_externo where id=? and estado in ('ACEPTADO','ENTREGADO','SIMULADO')",aviso)) continue;
            db.update("insert into intento_envio(tenant_id,aviso_id,numero,iniciado_en,estado) select ?,?,coalesce(max(numero),0)+1,now(),'INICIADO' from intento_envio where aviso_id=?",tenant,aviso,aviso);
            result.add(new Dispatch(aviso,task,Map.of("tenantId",tenant,"messageId",aviso,"channel",channel,
                "from",d.get("remitente"),"providerAccount",d.get("cuenta_externa"),"to",d.get("valor"),"event",type,
                "portalUrl",portal+"/entities/"+tenant+"/appointments/"+v.get("turno_id"))));
        }
        return result;
    }
    private void state(UUID task,String state) { db.update("update tarea_persistida set estado=?,bloqueada_hasta=null where id=?",state,task); }
    private void internal(UUID tenant,UUID task,UUID version,String type) {
        for(var r:db.list("select distinct m.cuenta_id from membresia m join membresia_permiso mp on mp.membresia_id=m.id and mp.tenant_id=m.tenant_id join permiso p on p.id=mp.permiso_id where p.codigo='notifications:manage' and m.estado='ACTIVA' and (m.hasta is null or m.hasta>now()) and mp.revocada_en is null and (mp.hasta is null or mp.hasta>now())"))
            db.update("insert into aviso_interno(tenant_id,tarea_id,version_turno_id,destinatario_id,tipo,clave_logica,creado_en) values (?,?,?,?,?,?,now()) on conflict(tenant_id,clave_logica,destinatario_id) do nothing",tenant,task,version,r.get("cuenta_id"),type,task+":"+type);
        audit.record(tenant,null,type,"tarea_persistida",task);
    }
    public void identityTick() {
        for(int n=0;n<10;n++) {
            Map<String,Object> job=global.execute(s -> {
                var rows=db.list("select d.* from identity_delivery d join token_identidad t on t.id=d.token_id where ((state in ('PENDING','RETRY') and due_at<=now()) or (state='SENDING' and due_at<now())) and attempts<5 and t.vence_en>now() and t.usado_en is null and t.revocado_en is null order by due_at for update of d skip locked limit 1");
                if(rows.isEmpty()) return null;
                var j=rows.getFirst(); db.update("update identity_delivery set state='SENDING',attempts=attempts+1,due_at=now()+interval '2 minutes' where id=?",j.get("id"));return j;
            });
            if(job==null) break;
            try {
                gateway.send(job.get("id").toString(),Map.of("channel","EMAIL","to",job.get("destination"),"event","IDENTITY","portalUrl",secrets.decrypt((String)job.get("encrypted_link"))));
                db.update("update identity_delivery set state=?,encrypted_link=case when ? then encrypted_link else null end where id=?",gateway.simulated()?"SIMULATED":"ACCEPTED",gateway.simulated(),job.get("id"));
            } catch(Exception e) {
                db.update("update identity_delivery set state=case when attempts>=5 then 'REVIEW' else 'RETRY' end,due_at=now()+interval '5 minutes',last_error='DELIVERY_FAILURE' where id=?",job.get("id"));
            }
        }
        db.update("update identity_delivery set encrypted_link=null,state='EXPIRED' where encrypted_link is not null and token_id in (select id from token_identidad where vence_en<=now() or usado_en is not null or revocado_en is not null)");
    }
}
