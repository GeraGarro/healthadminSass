package ar.com.salud.scheduling;

import ar.com.salud.audit.Audit;
import ar.com.salud.organization.Authorization;
import ar.com.salud.identity.IdentityService;
import ar.com.salud.shared.Db;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/** Se invoca dentro de TenantTransactions: capacidad, turno, auditoría y tareas comparten commit. */
@Service
public class BookingService {
    private final Db db; private final Authorization auth; private final Audit audit;
    public BookingService(Db db,Authorization auth,Audit audit) { this.db=db; this.auth=auth; this.audit=audit; }
    public Map<String,Object> hold(UUID tenant,UUID actor,String key,BookingController.HoldInput b) {
        return hold(tenant,actor,key,b,"booking:create");
    }
    private Map<String,Object> hold(UUID tenant,UUID actor,String key,BookingController.HoldInput b,String permission) {
        UUID previous=idempotency(actor,"HOLD",key,b.toString());
        if(previous!=null) return db.one("select id,vence_en,estado from pre_reserva where id=?",previous);
        var offer=offer(b.offerVersionId()); UUID agenda=Db.uuid(offer,"agenda_id");
        auth.booking(actor,b.patientId(),agenda,permission);
        boolean staff=auth.agenda(actor,agenda,permission);
        if(!staff && !(Boolean.TRUE.equals(offer.get("portal_habilitado")) && "BASE".equals(offer.get("origen")) && "CONSULTA".equals(offer.get("base_inicial"))))
            fail("Esta práctica requiere gestión de personal autorizado.");
        var pp=db.one("select pp.* from paciente_profesional pp join paciente p on p.id=pp.paciente_id and p.tenant_id=pp.tenant_id where pp.paciente_id=? and pp.profesional_entidad_id=? and pp.estado='ACTIVO' and p.estado='ACTIVO'",b.patientId(),offer.get("profesional_entidad_id"));
        db.jdbc.queryForObject("select pg_advisory_xact_lock(hashtextextended(?,0))",Object.class,"quota:"+tenant+":"+b.patientId());
        var policy=policy();
        int quota=((Number)policy.get("quota")).intValue();
        Integer count=db.jdbc.queryForObject("""
            select (select count(*) from pre_reserva h join paciente_profesional pp on pp.id=h.paciente_profesional_id and pp.tenant_id=h.tenant_id where pp.paciente_id=? and h.estado='ACTIVA' and h.vence_en>now())+
            (select count(*) from turno t join paciente_profesional pp on pp.id=t.paciente_profesional_id and pp.tenant_id=t.tenant_id join version_turno v on v.turno_id=t.id and v.tenant_id=t.tenant_id and v.sustituida_en is null where pp.paciente_id=? and t.estado_turno='REGISTRADO' and v.inicio_atencion>now())
            """,Integer.class,b.patientId(),b.patientId());
        if(count!=null && count>=quota) throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,"Límite de reservas activas alcanzado.");
        int duration=((Number)offer.get("duracion_min")).intValue();
        Instant end=b.start().plusSeconds(duration*60L);
        Instant capacityStart=b.start().minusSeconds(((Number)offer.get("preparacion_min")).longValue()*60);
        Instant capacityEnd=end.plusSeconds(((Number)offer.get("cierre_min")).longValue()*60);
        validateHours(agenda,(String)offer.get("zona_horaria"),capacityStart,capacityEnd);
        if(b.start().isBefore(now().plusSeconds(48*3600L)) && !staff) fail("Un turno cercano requiere atención del personal.");
        UUID eligibility=eligibility(tenant,b.patientId(),offer,b.affiliationId(),b.authorizationId(),b.start());
        Instant expiry=now().plusSeconds(((Number)policy.get("ttl")).longValue()*60);
        UUID capacity=db.id("select acquire_capacity(?,?,?,?)",agenda,capacityStart,capacityEnd,expiry);
        UUID id=db.id("insert into pre_reserva(tenant_id,paciente_profesional_id,agenda_id,version_oferta_id,elegibilidad_id,ocupacion_id,actor_id,inicio_atencion,fin_atencion,vence_en,estado,renovaciones) values (?,?,?,?,?,?,?,?,?,?,'ACTIVA',0) returning id",tenant,pp.get("id"),agenda,b.offerVersionId(),eligibility,capacity,actor,b.start(),end,expiry);
        saveIdempotency(tenant,actor,"HOLD",key,b.toString(),id);
        audit.record(tenant,actor,"HOLD_ACQUIRED","pre_reserva",id);
        return db.one("select id,vence_en,estado from pre_reserva where id=?",id);
    }
    public Map<String,Object> complete(UUID tenant,UUID actor,String key,UUID hold) {
        UUID existing=idempotency(actor,"BOOK",key,hold.toString());
        if(existing!=null) return booking(actor,existing,"booking:create",false);
        var h=db.one("select h.*,pp.paciente_id from pre_reserva h join paciente_profesional pp on pp.id=h.paciente_profesional_id and pp.tenant_id=h.tenant_id where h.id=? for update of h",hold);
        if(!actor.equals(h.get("actor_id"))) throw new org.springframework.security.access.AccessDeniedException("Pre-reserva de otro actor");
        auth.booking(actor,Db.uuid(h,"paciente_id"),Db.uuid(h,"agenda_id"),"booking:create");
        if(!"ACTIVA".equals(h.get("estado")) || !Db.instant(h,"vence_en").isAfter(now())) fail("La pre-reserva venció o ya fue utilizada.");
        var o=offer(Db.uuid(h,"version_oferta_id"));
        db.jdbc.queryForObject("select lock_agenda_capacity(?)",Object.class,h.get("agenda_id"));
        validateHours(Db.uuid(h,"agenda_id"),(String)o.get("zona_horaria"),
            Db.instant(h,"inicio_atencion").minusSeconds(((Number)o.get("preparacion_min")).longValue()*60),
            Db.instant(h,"fin_atencion").plusSeconds(((Number)o.get("cierre_min")).longValue()*60));
        if(!auth.agenda(actor,Db.uuid(h,"agenda_id"),"booking:create") && !Boolean.TRUE.equals(o.get("portal_habilitado"))) fail("Oferta ya no disponible en portal.");
        var ev=db.one("select * from evaluacion_elegibilidad where id=?",h.get("elegibilidad_id"));
        eligibility(tenant,Db.uuid(h,"paciente_id"),o,Db.uuid(ev,"afiliacion_id"),Db.uuid(ev,"autorizacion_id"),Db.instant(h,"inicio_atencion"));
        if(!Boolean.TRUE.equals(db.jdbc.queryForObject("select change_capacity(?,'BOOK')",Boolean.class,h.get("ocupacion_id")))) fail("Capacidad vencida.");
        UUID id=db.id("insert into turno(tenant_id,paciente_profesional_id,pre_reserva_id,creador_id,creado_en,estado_turno,estado_asistencia,estado_jornada,version_concurrencia) values (?,?,?,?,now(),'REGISTRADO','PENDIENTE','PENDIENTE',1) returning id",tenant,h.get("paciente_profesional_id"),hold,actor);
        UUID version=db.id("insert into version_turno(tenant_id,turno_id,numero_version,agenda_id,version_oferta_id,elegibilidad_id,ocupacion_id,inicio_atencion,fin_atencion,zona_horaria,condiciones_aplicadas,creada_en) values (?,?,1,?,?,?,?,?,?,?,jsonb_build_object('policy',?::text),now()) returning id",tenant,id,h.get("agenda_id"),h.get("version_oferta_id"),h.get("elegibilidad_id"),h.get("ocupacion_id"),h.get("inicio_atencion"),h.get("fin_atencion"),o.get("zona_horaria"),policy().get("id").toString());
        db.update("update pre_reserva set estado='CONVERTIDA' where id=?",hold);
        plan(tenant,version,Db.instant(h,"inicio_atencion"));
        saveIdempotency(tenant,actor,"BOOK",key,hold.toString(),id);
        event(tenant,actor,id,version,"REGISTRADO",null); return booking(actor,id,"booking:create",false);
    }
    public Map<String,Object> booking(UUID actor,UUID id,String permission,boolean lock) {
        var b=db.one("""
            select t.id,t.estado_turno,t.estado_asistencia,t.estado_jornada,t.version_concurrencia,
            v.id version_id,v.agenda_id,v.version_oferta_id,v.elegibilidad_id,v.ocupacion_id,v.numero_version,
            v.inicio_atencion,v.fin_atencion,v.zona_horaria,pp.paciente_id,pp.numero_visible,pp.profesional_entidad_id,
            pp.id paciente_profesional_id
            from turno t join version_turno v on v.turno_id=t.id and v.tenant_id=t.tenant_id and v.sustituida_en is null
            join paciente_profesional pp on pp.id=t.paciente_profesional_id and pp.tenant_id=t.tenant_id where t.id=?
            """+(lock?" for update of t":""),id);
        auth.booking(actor,Db.uuid(b,"paciente_id"),Db.uuid(b,"agenda_id"),permission); return b;
    }
    public Object confirm(UUID tenant,UUID actor,UUID id) { return confirm(tenant,actor,id,null); }
    public Object confirm(UUID tenant,UUID actor,UUID id,Long expected) {
        var b=booking(actor,id,"booking:confirm",true);expectVersion(b,expected);
        if(!"REGISTRADO".equals(b.get("estado_turno"))) fail("Turno no vigente.");
        if("CONFIRMADA".equals(b.get("estado_asistencia"))) return b;
        if(!Db.instant(b,"inicio_atencion").minusSeconds(24*3600L).isAfter(now()) && !auth.agenda(actor,Db.uuid(b,"agenda_id"),"booking:confirm")) fail("Plazo de confirmación finalizado. Contacte al personal.");
        db.update("insert into confirmacion_asistencia(tenant_id,version_turno_id,actor_id,medio,confirmada_en) values (?,?,?,'PORTAL',now())",tenant,b.get("version_id"),actor);
        db.update("update turno set estado_asistencia='CONFIRMADA',version_concurrencia=version_concurrencia+1 where id=?",id);
        event(tenant,actor,id,Db.uuid(b,"version_id"),"ASISTENCIA_CONFIRMADA",null); return Map.of("id",id,"attendance","CONFIRMADA");
    }
    public Object cancel(UUID tenant,UUID actor,UUID id,String reason) { return cancel(tenant,actor,id,reason,null); }
    public Object cancel(UUID tenant,UUID actor,UUID id,String reason,Long expected) {
        var b=booking(actor,id,"booking:cancel",true);expectVersion(b,expected);
        if("CANCELADO".equals(b.get("estado_turno"))) return Map.of("id",id,"state","CANCELADO");
        release(b);
        db.update("update turno set estado_turno='CANCELADO',version_concurrencia=version_concurrencia+1 where id=?",id);
        db.update("update tarea_persistida set estado='OBSOLETA' where version_turno_id=? and estado in ('PENDIENTE','REINTENTO')",b.get("version_id"));
        event(tenant,actor,id,Db.uuid(b,"version_id"),"CANCELADO",reason); return Map.of("id",id,"state","CANCELADO");
    }
    public Object reschedule(UUID tenant,UUID actor,UUID id,String key,BookingController.HoldInput input) { return reschedule(tenant,actor,id,key,input,null); }
    public Object reschedule(UUID tenant,UUID actor,UUID id,String key,BookingController.HoldInput input,Long expected) {
        String fingerprint=id+input.toString()+(expected==null?"":":"+expected);
        UUID existing=idempotency(actor,"MOVE",key,fingerprint);
        if(existing!=null) return booking(actor,existing,"booking:reschedule",false);
        var b=booking(actor,id,"booking:reschedule",true);expectVersion(b,expected);
        if(!"REGISTRADO".equals(b.get("estado_turno")) && !canRestoreAffected(actor,b)) fail("Turno no vigente.");
        if(!input.patientId().equals(b.get("paciente_id"))) fail("Paciente no corresponde al turno.");
        var target=offer(input.offerVersionId());
        var original=db.one("select p.origen,p.base_inicial from version_oferta v join oferta o on o.id=v.oferta_id and o.tenant_id=v.tenant_id join practica p on p.id=o.practica_id and p.tenant_id=o.tenant_id where v.id=?",b.get("version_oferta_id"));
        boolean staff=auth.agenda(actor,Db.uuid(b,"agenda_id"),"booking:reschedule");
        if(!staff && (!"CONSULTA".equals(original.get("base_inicial")) || !"BASE".equals(original.get("origen")))) fail("Reprogramación asistida requerida para esta práctica.");
        if(!target.get("profesional_entidad_id").equals(b.get("profesional_entidad_id"))) fail("El reemplazo requiere el mismo profesional y entidad.");
        // Liberar dentro de la transacción permite mover con superposición propia.
        // Si falla la adquisición, rollback conserva el intervalo y turno originales.
        db.jdbc.queryForObject("select pg_advisory_xact_lock(hashtextextended(?,0))",Object.class,"quota:"+tenant+":"+input.patientId());
        release(b);
        db.update("update turno set estado_turno='REPROGRAMANDO' where id=?",id); // no contar el original en cuota
        var held=hold(tenant,actor,"move-hold:"+IdentityService.hash(key),input,"booking:reschedule");
        var h=db.one("select * from pre_reserva where id=?",held.get("id"));
        if(!Boolean.TRUE.equals(db.jdbc.queryForObject("select change_capacity(?,'BOOK')",Boolean.class,h.get("ocupacion_id")))) fail("Capacidad vencida.");
        db.update("update version_turno set sustituida_en=now() where id=?",b.get("version_id"));
        UUID version=db.id("insert into version_turno(tenant_id,turno_id,numero_version,agenda_id,version_oferta_id,elegibilidad_id,ocupacion_id,inicio_atencion,fin_atencion,zona_horaria,condiciones_aplicadas,creada_en) values (?,?,?,?,?,?,?,?,?,?,'{}',now()) returning id",tenant,id,((Number)b.get("numero_version")).intValue()+1,h.get("agenda_id"),h.get("version_oferta_id"),h.get("elegibilidad_id"),h.get("ocupacion_id"),h.get("inicio_atencion"),h.get("fin_atencion"),target.get("zona_horaria"));
        db.update("update pre_reserva set estado='CONVERTIDA' where id=?",h.get("id"));
        db.update("update turno set estado_turno='REGISTRADO',estado_asistencia='PENDIENTE',version_concurrencia=version_concurrencia+1 where id=?",id);
        db.update("delete from recepcion_turno where turno_id=?",id);
        db.update("update tarea_persistida set estado='OBSOLETA' where version_turno_id=? and estado in ('PENDIENTE','REINTENTO')",b.get("version_id"));
        db.update("update turno_afectado set turno_reemplazo_id=?,estado_resolucion='REPROGRAMADO',resuelto_en=now() where version_original_id=? and estado_resolucion='PENDIENTE'",id,b.get("version_id"));
        plan(tenant,version,input.start()); saveIdempotency(tenant,actor,"MOVE",key,fingerprint,id);
        event(tenant,actor,id,version,"REPROGRAMADO",null); return booking(actor,id,"booking:reschedule",false);
    }
    public void absence(UUID tenant,UUID actor,UUID agenda,BookingController.AbsenceInput input,String key) {
        auth.requireAgenda(actor,agenda,"booking:reschedule");
        UUID existing=idempotency(actor,"ABSENCE",key,agenda+input.toString()); if(existing!=null) return;
        var a=db.one("select * from agenda where id=?",agenda);
        db.jdbc.queryForObject("select lock_agenda_capacity(?)",Object.class,agenda);
        if(!input.end().isAfter(input.start())) fail("Intervalo inválido.");
        UUID batch=db.id("insert into lote_reprogramacion(tenant_id,profesional_entidad_id,iniciador_id,motivo_interno,estado,creado_en,clave_operacion) values (?,?,?,?,'ABIERTA',now(),?) returning id",tenant,a.get("profesional_entidad_id"),actor,input.reason(),key);
        db.update("insert into intervalo_lote(tenant_id,lote_id,agenda_id,inicio,fin) values (?,?,?,?,?)",tenant,batch,agenda,input.start(),input.end());
        db.update("insert into excepcion_agenda(tenant_id,agenda_id,inicio,fin,tipo,motivo_interno,lote_id,autor_id) values (?,?,?,?,'AUSENCIA',?,?,?)",tenant,agenda,input.start(),input.end(),input.reason(),batch,actor);
        for(var b:db.list("select v.id from version_turno v join turno t on t.id=v.turno_id and t.tenant_id=v.tenant_id where v.agenda_id=? and v.sustituida_en is null and t.estado_turno='REGISTRADO' and v.inicio_atencion<? and v.fin_atencion>? for update of t",agenda,input.end(),input.start())) {
            UUID affected=db.id("insert into turno_afectado(tenant_id,lote_id,version_original_id,estado_aviso,estado_resolucion) values (?,?,?,'PENDIENTE','PENDIENTE') returning id",tenant,batch,b.get("id"));
            task(tenant,Db.uuid(b,"id"),affected,"ABSENCE_WHATSAPP",now(),"absence:"+affected);
        }
        saveIdempotency(tenant,actor,"ABSENCE",key,agenda+input.toString(),batch);
        audit.record(tenant,actor,"PROFESSIONAL_ABSENCE","lote_reprogramacion",batch);
    }
    public Map<String,Object> offer(UUID version) {
        return db.one("""
            select v.*,o.agenda_id,p.origen,p.base_inicial,a.zona_horaria,a.profesional_entidad_id,p.id practica_id
            from version_oferta v join oferta o on o.id=v.oferta_id and o.tenant_id=v.tenant_id
            join practica p on p.id=o.practica_id and p.tenant_id=o.tenant_id
            join agenda a on a.id=o.agenda_id and a.tenant_id=o.tenant_id
            join profesional_entidad pe on pe.id=a.profesional_entidad_id and pe.tenant_id=a.tenant_id
            where v.id=? and v.desde<=now() and (v.hasta is null or v.hasta>now()) and o.estado='ACTIVA'
              and p.estado='ACTIVA' and a.estado='ACTIVA' and pe.estado='ACTIVO'
            """,version);
    }
    public record PeriodCancellation(@jakarta.validation.constraints.NotNull LocalDate date,
        @jakarta.validation.constraints.Pattern(regexp="day|week|month") @jakarta.validation.constraints.NotBlank String period,
        @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max=300) String reason,
        @jakarta.validation.constraints.Min(0) int expectedCount){}
    private Instant[] periodWindow(UUID agenda,LocalDate date,String period){
        LocalDate from=switch(period){case "day"->date;case "week"->date.minusDays(date.getDayOfWeek().getValue()-1);case "month"->date.withDayOfMonth(1);default->throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Período inválido.");};
        LocalDate until=switch(period){case "day"->from.plusDays(1);case "week"->from.plusWeeks(1);default->from.plusMonths(1);};
        ZoneId zone=ZoneId.of((String)db.one("select zona_horaria from agenda where id=?",agenda).get("zona_horaria"));
        Instant end=until.atStartOfDay(zone).toInstant();if(!end.isAfter(now()))fail("El período ya terminó. Elegí una fecha actual o futura.");
        return new Instant[]{from.atStartOfDay(zone).toInstant(),end};
    }
    private List<Map<String,Object>> periodTurns(UUID agenda,Instant[] window,boolean lock){return db.list("select t.id,v.id version_id,v.inicio_atencion,p.nombres,p.apellidos from turno t join version_turno v on v.turno_id=t.id and v.tenant_id=t.tenant_id and v.sustituida_en is null join paciente_profesional pp on pp.id=t.paciente_profesional_id and pp.tenant_id=t.tenant_id join paciente p on p.id=pp.paciente_id and p.tenant_id=pp.tenant_id where v.agenda_id=? and t.estado_turno='REGISTRADO' and v.inicio_atencion>=? and v.inicio_atencion<? and v.inicio_atencion>now() and not exists(select 1 from recepcion_turno r where r.turno_id=t.id and r.tenant_id=t.tenant_id and r.estado in ('ATENCION','FINALIZADO')) order by v.inicio_atencion,t.id"+(lock?" for update of t":""),agenda,window[0],window[1]);}
    public Object periodPreview(UUID agenda,LocalDate date,String period){Instant[] window=periodWindow(agenda,date,period);var turns=periodTurns(agenda,window,false);return Map.of("from",window[0],"until",window[1],"count",turns.size(),"patients",turns.stream().limit(20).toList());}
    public Object cancelPeriod(UUID tenant,UUID actor,UUID agenda,PeriodCancellation input,String key){
        auth.requireAgenda(actor,agenda,"agenda:configure");
        db.one("select a.id from agenda a join profesional_entidad pe on pe.id=a.profesional_entidad_id and pe.tenant_id=a.tenant_id join profesional_global pg on pg.id=pe.profesional_id where a.id=? and a.tenant_id=? and pg.cuenta_id=?",agenda,tenant,actor);
        String fingerprint=agenda+input.toString();UUID previous=idempotency(actor,"CANCEL_PERIOD",key,fingerprint);
        if(previous!=null)return Map.of("id",previous,"cancelled",db.one("select count(*) cantidad from turno_afectado where lote_id=?",previous).get("cantidad"));
        Instant[] window=periodWindow(agenda,input.date(),input.period());if(input.reason().isBlank())fail("Indicá el motivo de la cancelación.");
        db.jdbc.queryForObject("select lock_agenda_capacity(?)",Object.class,agenda);
        var turns=periodTurns(agenda,window,true);if(turns.size()!=input.expectedCount())fail("La cantidad de turnos cambió. Volvé a revisar el período antes de confirmar.");
        var a=db.one("select profesional_entidad_id from agenda where id=?",agenda);
        UUID batch=db.id("insert into lote_reprogramacion(tenant_id,profesional_entidad_id,iniciador_id,motivo_interno,estado,creado_en,clave_operacion) values (?,?,?,?,'ABIERTA',now(),?) returning id",tenant,a.get("profesional_entidad_id"),actor,input.reason().trim(),key);
        db.update("insert into intervalo_lote(tenant_id,lote_id,agenda_id,inicio,fin) values (?,?,?,?,?)",tenant,batch,agenda,window[0],window[1]);
        db.update("insert into excepcion_agenda(tenant_id,agenda_id,inicio,fin,tipo,motivo_interno,lote_id,autor_id) values (?,?,?,?,'AUSENCIA',?,?,?)",tenant,agenda,window[0],window[1],input.reason().trim(),batch,actor);
        for(var turn:turns){
            UUID id=Db.uuid(turn,"id"),version=Db.uuid(turn,"version_id");
            UUID affected=db.id("insert into turno_afectado(tenant_id,lote_id,version_original_id,estado_aviso,estado_resolucion) values (?,?,?,'PENDIENTE','PENDIENTE') returning id",tenant,batch,version);
            cancel(tenant,actor,id,input.reason().trim());
            task(tenant,version,affected,"CANCELLED_PERIOD_EMAIL",now(),"cancel-email:"+affected);
            task(tenant,version,affected,"CANCELLED_PERIOD_WHATSAPP",now(),"cancel-whatsapp:"+affected);
            for(var recipient:db.list("select distinct m.cuenta_id from delegacion_agenda d join membresia m on m.id=d.membresia_id and m.tenant_id=d.tenant_id join delegacion_permiso dp on dp.delegacion_id=d.id and dp.tenant_id=d.tenant_id join permiso p on p.id=dp.permiso_id where d.agenda_id=? and d.revocada_en is null and d.desde<=now() and (d.hasta is null or d.hasta>now()) and m.estado='ACTIVA' and m.desde<=now() and (m.hasta is null or m.hasta>now()) and p.codigo='booking:read'",agenda))
                db.update("insert into aviso_interno(tenant_id,version_turno_id,destinatario_id,tipo,clave_logica,creado_en) values (?,?,?,'AGENDA_PERIOD_CANCELLED',?,now()) on conflict(tenant_id,clave_logica,destinatario_id) do nothing",tenant,version,recipient.get("cuenta_id"),"period-cancel:"+batch+":"+id);
        }
        for(var hold:db.list("select id,ocupacion_id from pre_reserva where agenda_id=? and estado='ACTIVA' and inicio_atencion>=? and inicio_atencion<? for update",agenda,window[0],window[1])){db.jdbc.queryForObject("select change_capacity(?,'RELEASE')",Boolean.class,hold.get("ocupacion_id"));db.update("update pre_reserva set estado='CANCELADA' where id=?",hold.get("id"));}
        saveIdempotency(tenant,actor,"CANCEL_PERIOD",key,fingerprint,batch);audit.record(tenant,actor,"AGENDA_PERIOD_CANCELLED","lote_reprogramacion",batch);return Map.of("id",batch,"cancelled",turns.size());
    }
    private void validateHours(UUID agenda,String timezone,Instant start,Instant end) {
        var a=start.atZone(ZoneId.of(timezone)); var b=end.atZone(ZoneId.of(timezone));
        if(!a.toLocalDate().equals(b.toLocalDate()) || !db.exists("select 1 from horario_agenda where agenda_id=? and dia_semana=? and desde<=? and (hasta is null or hasta>=?) and hora_inicio<=? and hora_fin>=?",agenda,a.getDayOfWeek().getValue(),a.toLocalDate(),a.toLocalDate(),a.toLocalTime(),b.toLocalTime())) fail("Fuera del horario habilitado.");
        if(db.exists("select 1 from excepcion_agenda where agenda_id=? and inicio<? and fin>?",agenda,end,start)) fail("Horario no disponible.");
    }
    private UUID eligibility(UUID tenant,UUID patient,Map<String,Object> offer,UUID affiliation,UUID authorization,Instant at) {
        UUID agreement=null;
        if(affiliation==null) {
            if(authorization!=null) fail("Una autorización requiere una afiliación verificada.");
            if(!Boolean.TRUE.equals(offer.get("particular_habilitado"))) fail("La oferta no admite modalidad particular.");
        } else {
            LocalDate localDate=at.atZone(ZoneId.of((String)offer.get("zona_horaria"))).toLocalDate();
            var f=db.one("select * from afiliacion_paciente where id=? and paciente_id=? and estado_verificacion='VERIFICADA' and (desde is null or desde<=?::date) and (hasta is null or hasta>=?::date)",affiliation,patient,localDate,localDate);
            var c=db.one("select v.* from convenio c join version_convenio v on v.convenio_id=c.id and v.tenant_id=c.tenant_id where c.oferta_id=? and c.cobertura_id=? and (c.plan_id is null or c.plan_id=?::uuid) and c.estado='ACTIVO' and v.desde<=? and (v.hasta is null or v.hasta>?) and v.resultado_regla='PERMITIDA' order by (c.plan_id is not null) desc,v.numero_version desc limit 1",offer.get("oferta_id"),f.get("cobertura_id"),f.get("plan_id"),at,at);
            agreement=Db.uuid(c,"id");
            if(Boolean.TRUE.equals(c.get("requiere_autorizacion"))||authorization!=null) db.one("select id from autorizacion_cobertura where id=? and afiliacion_id=? and practica_id=? and estado='VERIFICADA' and (desde is null or desde<=?) and (hasta is null or hasta>?)",authorization,affiliation,offer.get("practica_id"),at,at);
        }
        return db.id("insert into evaluacion_elegibilidad(tenant_id,paciente_id,version_oferta_id,modalidad_elegida,afiliacion_id,version_convenio_id,autorizacion_id,resultado,evaluada_en,evidencia) values (?,?,?,?,?,?,?,'PERMITIDA',now(),'{}') returning id",tenant,patient,offer.get("id"),affiliation==null?"PARTICULAR":"COBERTURA",affiliation,agreement,authorization);
    }
    public String authorizeScheduling(UUID actor,UUID patient,UUID agenda,UUID appointment) {
        if(appointment==null){auth.booking(actor,patient,agenda,"booking:create");return "booking:create";}
        var current=booking(actor,appointment,"booking:reschedule",false);
        if(!patient.equals(current.get("paciente_id"))||(!"REGISTRADO".equals(current.get("estado_turno"))&&!canRestoreAffected(actor,current)))fail("Turno no vigente o paciente incompatible.");
        var target=db.one("select profesional_entidad_id from agenda where id=?",agenda);
        if(!target.get("profesional_entidad_id").equals(current.get("profesional_entidad_id")))fail("El reemplazo requiere el mismo profesional y entidad.");
        auth.booking(actor,patient,agenda,"booking:reschedule");return "booking:reschedule";
    }
    private static void expectVersion(Map<String,Object> current,Long expected) {
        if(expected!=null&&((Number)current.get("version_concurrencia")).longValue()!=expected)
            throw new ResponseStatusException(HttpStatus.PRECONDITION_FAILED,"El turno cambió desde que se abrió. Actualice y revise la nueva versión antes de continuar.");
    }
    private boolean canRestoreAffected(UUID actor,Map<String,Object> booking) {
        return "CANCELADO".equals(booking.get("estado_turno")) && auth.agenda(actor,Db.uuid(booking,"agenda_id"),"booking:reschedule") && db.exists("select 1 from turno_afectado where version_original_id=? and estado_resolucion='PENDIENTE'",booking.get("version_id"));
    }
    public Map<String,Object> policy() {
        return db.one("select id,(parametros->>'holdMinutes')::int ttl,(parametros->>'maxActive')::int quota,(parametros->>'automaticClose')::boolean automatic_close from politica_operativa where tipo='RESERVAS' and desde<=now() and (hasta is null or hasta>now()) order by numero_version desc limit 1");
    }
    private UUID idempotency(UUID actor,String operation,String key,String input) {
        if(key==null || key.isBlank() || key.length()>100) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Idempotency-Key requerido, de hasta 100 caracteres.");
        db.jdbc.queryForObject("select pg_advisory_xact_lock(hashtextextended(?,0))",Object.class,"idem:"+actor+":"+operation+":"+key);
        var previous=db.list("select * from idempotencia where actor_id=? and operacion=? and clave=?",actor,operation,key);
        if(previous.isEmpty()) return null;
        if(!IdentityService.hash(input).equals(previous.getFirst().get("huella_entrada"))) fail("Clave de idempotencia reutilizada con otros datos.");
        return UUID.fromString((String)previous.getFirst().get("resultado_ref"));
    }
    private void saveIdempotency(UUID tenant,UUID actor,String operation,String key,String input,UUID result) {
        db.update("insert into idempotencia(tenant_id,actor_id,operacion,clave,huella_entrada,resultado_ref,estado,creada_en) values (?,?,?,?,?,?,'COMPLETA',now())",tenant,actor,operation,key,IdentityService.hash(input),result.toString());
    }
    private void plan(UUID tenant,UUID version,Instant start) {
        if(start.isBefore(now().plusSeconds(48*3600L))) { task(tenant,version,null,"ASSISTED_REVIEW",now(),"review:"+version); return; }
        task(tenant,version,null,"CONFIRMATION_EMAIL",start.minusSeconds(60*3600L).isBefore(now())?now():start.minusSeconds(60*3600L),"email:"+version);
        task(tenant,version,null,"BACKUP_WHATSAPP",start.minusSeconds(36*3600L),"whatsapp:"+version);
        task(tenant,version,null,"CLOSE_UNCONFIRMED",start.minusSeconds(24*3600L),"close:"+version);
    }
    private void task(UUID tenant,UUID version,UUID affected,String type,Instant at,String key) {
        db.update("insert into tarea_persistida(tenant_id,version_turno_id,turno_afectado_id,tipo,deduplicacion,programada_en,estado,intentos,version_politica_ref) values (?,?,?,?,?,?,'PENDIENTE',0,?) on conflict(tenant_id,deduplicacion) do nothing",tenant,version,affected,type,key,at,policy().get("id").toString());
    }
    private void release(Map<String,Object> b) { db.jdbc.queryForObject("select change_capacity(?,'RELEASE')",Boolean.class,b.get("ocupacion_id")); }
    public void event(UUID tenant,UUID actor,UUID booking,UUID version,String type,String reason) {
        db.update("insert into evento_turno(tenant_id,turno_id,version_turno_id,actor_id,servicio_actor,tipo,ocurrido_en,motivo,resultado,cambios_minimos) values (?,?,?,?,?,?,now(),?,'OK','{}')",tenant,booking,version,actor,actor==null?"worker":null,type,reason);
        audit.record(tenant,actor,type,"turno",booking);
    }
    private Instant now() { return db.jdbc.queryForObject("select current_timestamp",java.sql.Timestamp.class).toInstant(); }
    private static void fail(String message) { throw new ResponseStatusException(HttpStatus.CONFLICT,message); }
}

