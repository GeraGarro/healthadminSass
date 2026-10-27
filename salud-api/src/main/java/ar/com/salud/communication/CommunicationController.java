package ar.com.salud.communication;

import ar.com.salud.audit.Audit;
import ar.com.salud.identity.IdentityService;
import ar.com.salud.organization.Authorization;
import ar.com.salud.shared.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.security.Principal;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/entities/{tenant}")
public class CommunicationController {
    private final Db db; private final TenantTransactions tx; private final Authorization auth; private final Audit audit; private final IdentityService identity;
    public CommunicationController(Db db,TenantTransactions tx,Authorization auth,Audit audit,IdentityService identity) {this.db=db;this.tx=tx;this.auth=auth;this.audit=audit;this.identity=identity;}
    public record ConversationInput(@NotNull UUID patientProfessionalId) {}
    public record MessageInput(@NotBlank @Size(max=4000) String text) {}
    public record ChannelInput(@NotNull @Pattern(regexp="EMAIL|WHATSAPP") String channel,@NotBlank String sender,@NotBlank String providerAccount,@NotBlank String verificationReference) {}
    private static UUID actor(Principal p) { return UUID.fromString(p.getName()); }
    @PostMapping("/channels") public Object channel(Principal p,@PathVariable UUID tenant,@Valid @RequestBody ChannelInput b) {
        return tx.run(tenant,actor(p),() -> {auth.requireCare(actor(p));auth.require(actor(p),"notifications:manage");
            db.update("update canal_entidad set estado='INACTIVO' where canal=?",b.channel());
            UUID id=db.id("insert into canal_entidad(tenant_id,canal,proveedor,cuenta_externa,remitente,secreto_ref,verificada_en,estado) values (?,?,'GATEWAY',?,?,'DELIVERY_TOKEN',now(),'ACTIVO') returning id",tenant,b.channel(),b.providerAccount(),b.sender());
            audit.record(tenant,actor(p),"CHANNEL_CONFIGURED","canal_entidad",id);return Map.of("id",id);});
    }
    @GetMapping("/notifications") public Object notifications(Principal p,@PathVariable UUID tenant) {
        return tx.run(tenant,actor(p),() -> {auth.requireCare(actor(p));return db.list("select id,tipo,version_turno_id,creado_en,leido_en,resuelto_en from aviso_interno where destinatario_id=? order by id desc limit 100",actor(p));});
    }
    @PostMapping("/notifications/{id}/read") public void readNotification(Principal p,@PathVariable UUID tenant,@PathVariable UUID id) {
        tx.run(tenant,actor(p),() -> {auth.requireCare(actor(p));db.update("update aviso_interno set leido_en=coalesce(leido_en,now()) where id=? and destinatario_id=?",id,actor(p));return null;});
    }
    @GetMapping("/tasks") public Object tasks(Principal p,@PathVariable UUID tenant) {
        return tx.run(tenant,actor(p),() -> {auth.requireCare(actor(p));auth.require(actor(p),"notifications:manage");return db.list("select id,tipo,programada_en,estado,intentos,ultimo_error from tarea_persistida order by id desc limit 100");});
    }
    @PostMapping("/tasks/{id}/retry") public void retry(Principal p,@PathVariable UUID tenant,@PathVariable UUID id) {
        tx.run(tenant,actor(p),() -> {auth.requireCare(actor(p));auth.require(actor(p),"notifications:manage");
            // Cierres tardíos nunca se reejecutan desde esta bandeja.
            db.update("update tarea_persistida set estado='PENDIENTE',intentos=0,programada_en=now() where id=? and estado in ('REVISION','REINTENTO') and tipo in ('CONFIRMATION_EMAIL','BACKUP_WHATSAPP','ABSENCE_WHATSAPP','CANCELLED_PERIOD_EMAIL','CANCELLED_PERIOD_WHATSAPP')",id);
            audit.record(tenant,actor(p),"TASK_RETRIED","tarea_persistida",id);return null;});
    }
    @PostMapping("/conversations") public Object conversation(Principal p,@PathVariable UUID tenant,@Valid @RequestBody ConversationInput b) {
        return tx.run(tenant,actor(p),() -> {auth.requireCare(actor(p));
            var pp=db.one("select pp.*,pg.cuenta_id professional_account from paciente_profesional pp join profesional_global pg on pg.id=pp.profesional_id where pp.id=? and pp.estado='ACTIVO'",b.patientProfessionalId());
            UUID agenda=Db.uuid(db.one("select id from agenda where profesional_entidad_id=? order by id limit 1",pp.get("profesional_entidad_id")),"id");
            boolean patient=auth.patient(actor(p),Db.uuid(pp,"paciente_id"),agenda,"chat:write");
            if(!patient && !actor(p).equals(pp.get("professional_account"))) throw new org.springframework.security.access.AccessDeniedException("Participantes explícitos requeridos");
            if(!patient) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT,"La conversación debe iniciarla el paciente o representante habilitado.");
            UUID id=db.id("insert into conversacion(tenant_id,paciente_profesional_id,estado,creada_en) values (?,?,'ABIERTA',now()) returning id",tenant,b.patientProfessionalId());
            participant(tenant,id,actor(p),"PACIENTE");participant(tenant,id,Db.uuid(pp,"professional_account"),"PROFESIONAL");
            audit.record(tenant,actor(p),"CONVERSATION_CREATED","conversacion",id);return Map.of("id",id);});
    }
    @GetMapping("/conversations") public Object conversations(Principal p,@PathVariable UUID tenant) {
        return tx.run(tenant,actor(p),() -> {auth.requireCare(actor(p));return db.list("select c.id,c.creada_en,c.estado,pp.paciente_id,p.nombres,p.apellidos from conversacion c join participante_chat pc on pc.conversacion_id=c.id and pc.tenant_id=c.tenant_id join paciente_profesional pp on pp.id=c.paciente_profesional_id and pp.tenant_id=c.tenant_id join paciente p on p.id=pp.paciente_id and p.tenant_id=pp.tenant_id where pc.cuenta_id=? and pc.revocado_en is null and (pc.hasta is null or pc.hasta>now()) order by c.id desc limit 100",actor(p)).stream().filter(c -> canChat(actor(p),Db.uuid(c,"id"),"chat:read")).toList();});
    }

    @GetMapping("/workspace/conversations") public Object conversationPage(Principal p,@PathVariable UUID tenant,@RequestParam(defaultValue="0") @Min(0) int offset) {
        return tx.run(tenant,actor(p),()->{auth.requireCare(actor(p));
            var rows=db.list("select c.id,c.creada_en,c.estado,pp.paciente_id,p.nombres,p.apellidos from conversacion c join participante_chat pc on pc.conversacion_id=c.id and pc.tenant_id=c.tenant_id join paciente_profesional pp on pp.id=c.paciente_profesional_id and pp.tenant_id=c.tenant_id join paciente p on p.id=pp.paciente_id and p.tenant_id=pp.tenant_id where pc.cuenta_id=? and pc.revocado_en is null and (pc.hasta is null or pc.hasta>now()) order by c.id limit 101 offset ?",actor(p),offset);
            var result=new LinkedHashMap<String,Object>();
            var visible=rows.stream().limit(100).filter(c->canChat(actor(p),Db.uuid(c,"id"),"chat:read")).toList();
            for(var conversation:visible) conversation.put("unread",db.one("""
                select count(*) unread from mensaje m
                join participante_chat author on author.id=m.participante_autor_id and author.tenant_id=m.tenant_id
                where m.conversacion_id=? and author.cuenta_id<>?
                and not exists(select 1 from lectura_mensaje l join participante_chat reader
                    on reader.id=l.participante_id and reader.tenant_id=l.tenant_id
                    where l.mensaje_id=m.id and l.tenant_id=m.tenant_id and reader.cuenta_id=?)
                """,conversation.get("id"),actor(p),actor(p)).get("unread"));
            result.put("items",visible);
            result.put("nextOffset",rows.size()>100?offset+100:null);return result;
        });
    }
    @GetMapping("/conversations/{id}/messages") public Object messages(Principal p,@PathVariable UUID tenant,@PathVariable UUID id,@RequestParam(required=false) UUID before) {
        return tx.run(tenant,actor(p),() -> {auth.requireCare(actor(p));requireChat(actor(p),id,"chat:read");audit.record(tenant,actor(p),"CHAT_READ","conversacion",id);
            return db.list("""
                select m.id,m.participante_autor_id,m.texto,m.enviado_en,m.estado,pc.cuenta_id=? propio,
                    exists(select 1 from lectura_mensaje l join participante_chat reader
                        on reader.id=l.participante_id and reader.tenant_id=l.tenant_id
                        where l.mensaje_id=m.id and l.tenant_id=m.tenant_id and reader.cuenta_id=?) leido
                from mensaje m join participante_chat pc on pc.id=m.participante_autor_id and pc.tenant_id=m.tenant_id
                where m.conversacion_id=? and (?::uuid is null or m.id<?) order by m.id desc limit 100
                """,actor(p),actor(p),id,before,before);});
    }
    @PostMapping("/conversations/{id}/messages") public Object message(Principal p,@PathVariable UUID tenant,@PathVariable UUID id,@Valid @RequestBody MessageInput b) {
        identity.throttle("chat:"+actor(p),60);
        return tx.run(tenant,actor(p),() -> {auth.requireCare(actor(p));UUID participant=requireChat(actor(p),id,"chat:write");
            UUID message=db.id("insert into mensaje(tenant_id,conversacion_id,participante_autor_id,texto,enviado_en,estado) values (?,?,?,?,now(),'ENVIADO') returning id",tenant,id,participant,b.text());
            for(var to:db.list("select cuenta_id from participante_chat where conversacion_id=? and cuenta_id<>? and revocado_en is null and (hasta is null or hasta>now())",id,actor(p)))
                db.update("insert into aviso_interno(tenant_id,conversacion_id,destinatario_id,tipo,clave_logica,creado_en) values (?,?,?,'CHAT_MESSAGE',?,now())",tenant,id,to.get("cuenta_id"),"message:"+message);
            audit.record(tenant,actor(p),"CHAT_MESSAGE_SENT","mensaje",message);return Map.of("id",message);});
    }
    @PostMapping("/conversations/{id}/messages/{message}/read") public void read(Principal p,@PathVariable UUID tenant,@PathVariable UUID id,@PathVariable UUID message) {
        tx.run(tenant,actor(p),() -> {auth.requireCare(actor(p));UUID participant=requireChat(actor(p),id,"chat:read");
            db.one("select id from mensaje where id=? and conversacion_id=?",message,id);
            db.update("insert into lectura_mensaje(tenant_id,mensaje_id,participante_id,leido_en) values (?,?,?,now()) on conflict(tenant_id,mensaje_id,participante_id) do nothing",tenant,message,participant);return null;});
    }
    private void participant(UUID tenant,UUID conversation,UUID account,String type) {
        UUID id=db.id("insert into participante_chat(tenant_id,conversacion_id,cuenta_id,tipo,desde) values (?,?,?,?,now()) returning id",tenant,conversation,account,type);
        for(String perm:List.of("chat:read","chat:write")) db.update("insert into participante_permiso(tenant_id,participante_id,permiso_id) select ?,?,id from permiso where codigo=?",tenant,id,perm);
    }
    private UUID requireChat(UUID actor,UUID conversation,String permission) {
        if(!canChat(actor,conversation,permission)) throw new org.springframework.security.access.AccessDeniedException("Sin permiso de conversación");
        return Db.uuid(db.one("select id from participante_chat where conversacion_id=? and cuenta_id=? and revocado_en is null and (hasta is null or hasta>now())",conversation,actor),"id");
    }
    private boolean canChat(UUID actor,UUID conversation,String permission) {
        var rows=db.list("select pc.*,pp.paciente_id,pp.profesional_entidad_id,pg.cuenta_id professional_account from participante_chat pc join conversacion c on c.id=pc.conversacion_id and c.tenant_id=pc.tenant_id join paciente_profesional pp on pp.id=c.paciente_profesional_id and pp.tenant_id=c.tenant_id join profesional_global pg on pg.id=pp.profesional_id join participante_permiso sp on sp.participante_id=pc.id and sp.tenant_id=pc.tenant_id join permiso p on p.id=sp.permiso_id where pc.cuenta_id=? and c.id=? and c.estado='ABIERTA' and pc.desde<=now() and (pc.hasta is null or pc.hasta>now()) and pc.revocado_en is null and p.codigo=?",actor,conversation,permission);
        if(rows.isEmpty()) return false;
        var r=rows.getFirst();
        var agendas=db.list("select id from agenda where profesional_entidad_id=? and estado='ACTIVA' limit 1",r.get("profesional_entidad_id"));
        if(agendas.isEmpty()) return false;
        UUID agenda=Db.uuid(agendas.getFirst(),"id");
        return actor.equals(r.get("professional_account"))?auth.agenda(actor,agenda,"agenda:read"):auth.patient(actor,Db.uuid(r,"paciente_id"),agenda,permission);
    }
}
