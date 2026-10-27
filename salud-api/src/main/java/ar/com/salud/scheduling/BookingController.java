package ar.com.salud.scheduling;

import ar.com.salud.audit.Audit;
import ar.com.salud.organization.Authorization;
import ar.com.salud.shared.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.security.Principal;
import java.time.*;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/entities/{tenant}")
public class BookingController {
    private final Db db; private final TenantTransactions tx; private final Authorization auth; private final BookingService service; private final Audit audit;
    public BookingController(Db db,TenantTransactions tx,Authorization auth,BookingService service,Audit audit) { this.db=db;this.tx=tx;this.auth=auth;this.service=service;this.audit=audit; }
    public record HoldInput(@NotNull UUID patientId,@NotNull UUID offerVersionId,@NotNull @Future Instant start,UUID affiliationId,UUID authorizationId) {}
    public record CompleteInput(@NotNull UUID holdId) {}
    public record CancelInput(@NotBlank @Size(max=300) String reason) {}
    public record AbsenceInput(@NotNull Instant start,@NotNull Instant end,@NotBlank @Size(max=300) String reason) {}
    public record ManagementInput(@NotNull UUID patientId,@NotNull UUID professionalEntityId,UUID practiceId,@NotBlank @Size(max=500) String reason) {}
    private static UUID actor(Principal p) { return UUID.fromString(p.getName()); }
    @GetMapping("/agendas") public Object agendas(Principal p,@PathVariable UUID tenant,@RequestParam(required=false) UUID patientId) {
        return tx.run(tenant,actor(p),() -> db.list("select id,nombre,zona_horaria,profesional_entidad_id from agenda where estado='ACTIVA' order by id limit 200").stream()
            .filter(a -> auth.agenda(actor(p),Db.uuid(a,"id"),"agenda:read") || patientId!=null && auth.patient(actor(p),patientId,Db.uuid(a,"id"),"booking:read")).toList());
    }
    @GetMapping("/agendas/{agenda}/offers") public Object offers(Principal p,@PathVariable UUID tenant,@PathVariable UUID agenda,@RequestParam(required=false) UUID patientId) {
        return tx.run(tenant,actor(p),() -> {
            if(patientId==null) auth.requireAgenda(actor(p),agenda,"agenda:read"); else auth.booking(actor(p),patientId,agenda,"booking:read");
            return db.list("select v.*,vp.nombre,p.id practica_id,p.base_inicial,p.origen from version_oferta v join oferta o on o.id=v.oferta_id and o.tenant_id=v.tenant_id join practica p on p.id=o.practica_id and p.tenant_id=o.tenant_id join version_practica vp on vp.id=v.version_practica_id and vp.tenant_id=v.tenant_id where o.agenda_id=? and o.estado='ACTIVA' and v.desde<=now() and (v.hasta is null or v.hasta>now()) order by v.id limit 100",agenda); });
    }
    @GetMapping("/agendas/{agenda}/hours") public Object hours(Principal p,@PathVariable UUID tenant,@PathVariable UUID agenda,@RequestParam(required=false) UUID patientId) {
        return tx.run(tenant,actor(p),() -> { if(patientId==null) auth.requireAgenda(actor(p),agenda,"agenda:read"); else auth.booking(actor(p),patientId,agenda,"booking:read");
            return db.list("select dia_semana,hora_inicio,hora_fin,desde,hasta from horario_agenda where agenda_id=? order by dia_semana,hora_inicio",agenda); });
    }
    @PostMapping("/holds") public Object hold(Principal p,@PathVariable UUID tenant,@RequestHeader("Idempotency-Key") String key,@Valid @RequestBody HoldInput b) {
        return tx.run(tenant,actor(p),() -> service.hold(tenant,actor(p),key,b));
    }
    @GetMapping("/availability") public Object available(Principal p,@PathVariable UUID tenant,@RequestParam UUID offerVersionId,@RequestParam UUID patientId,@RequestParam LocalDate date) {
        return availability(p,tenant,offerVersionId,patientId,date,null);
    }
    @GetMapping("/availability-for-rescheduling") public Object reschedulingAvailability(Principal p,@PathVariable UUID tenant,@RequestParam UUID offerVersionId,@RequestParam UUID patientId,@RequestParam LocalDate date,@RequestParam UUID appointmentId) {
        return availability(p,tenant,offerVersionId,patientId,date,appointmentId);
    }
    private Object availability(Principal p,UUID tenant,UUID offerVersionId,UUID patientId,LocalDate date,UUID appointmentId) {
        return tx.run(tenant,actor(p),() -> {
            var offer=service.offer(offerVersionId);UUID agenda=Db.uuid(offer,"agenda_id");
            String permission=service.authorizeScheduling(actor(p),patientId,agenda,appointmentId);
            if(!auth.agenda(actor(p),agenda,permission) && !(Boolean.TRUE.equals(offer.get("portal_habilitado"))&&"BASE".equals(offer.get("origen"))&&"CONSULTA".equals(offer.get("base_inicial"))))throw new org.springframework.security.access.AccessDeniedException("Práctica de gestión asistida");
            int duration=((Number)offer.get("duracion_min")).intValue(),preparation=((Number)offer.get("preparacion_min")).intValue(),closing=((Number)offer.get("cierre_min")).intValue();
            var zone=ZoneId.of((String)offer.get("zona_horaria"));var starts=new TreeSet<Instant>();
            for(var h:db.list("select hora_inicio,hora_fin from horario_agenda where agenda_id=? and dia_semana=? and desde<=? and (hasta is null or hasta>=?)",agenda,date.getDayOfWeek().getValue(),date,date)) {
                Instant first=date.atTime(((java.sql.Time)h.get("hora_inicio")).toLocalTime()).atZone(zone).toInstant();
                Instant last=date.atTime(((java.sql.Time)h.get("hora_fin")).toLocalTime()).atZone(zone).toInstant();
                for(Instant slot=first.plusSeconds(preparation*60L);!slot.plusSeconds((duration+closing)*60L).isAfter(last);slot=slot.plusSeconds((duration+preparation+closing)*60L)) {
                    if(Boolean.TRUE.equals(db.jdbc.queryForObject("select capacity_available(?,?,?,?)",Boolean.class,agenda,java.sql.Timestamp.from(slot.minusSeconds(preparation*60L)),java.sql.Timestamp.from(slot.plusSeconds((duration+closing)*60L)),appointmentId)))starts.add(slot);
                }
            }
            return Map.of("starts",starts,"timezone",zone.getId(),"durationMinutes",duration);
        });
    }
    @PostMapping("/appointments") public Object complete(Principal p,@PathVariable UUID tenant,@RequestHeader("Idempotency-Key") String key,@Valid @RequestBody CompleteInput b) {
        return tx.run(tenant,actor(p),() -> service.complete(tenant,actor(p),key,b.holdId()));
    }
    @GetMapping("/appointments/{id}") public Object get(Principal p,@PathVariable UUID tenant,@PathVariable UUID id) {
        return tx.run(tenant,actor(p),() -> { var result=service.booking(actor(p),id,"booking:read",false);audit.record(tenant,actor(p),"BOOKING_READ","turno",id);return result; });
    }
    @GetMapping("/appointments") public Object list(Principal p,@PathVariable UUID tenant,@RequestParam(required=false) UUID agendaId,@RequestParam(required=false) UUID patientId) {
        return tx.run(tenant,actor(p),() -> {
            if(agendaId==null && patientId==null) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST,"Indique agendaId o patientId.");
            if(agendaId!=null && patientId==null) auth.requireAgenda(actor(p),agendaId,"booking:read");
            var ids=db.list("select t.id from turno t join version_turno v on v.turno_id=t.id and v.tenant_id=t.tenant_id and v.sustituida_en is null join paciente_profesional pp on pp.id=t.paciente_profesional_id and pp.tenant_id=t.tenant_id where (?::uuid is null or v.agenda_id=?) and (?::uuid is null or pp.paciente_id=?) order by v.inicio_atencion desc limit 100",agendaId,agendaId,patientId,patientId);
            var result=ids.stream().map(r -> service.booking(actor(p),Db.uuid(r,"id"),"booking:read",false)).toList();
            audit.record(tenant,actor(p),"BOOKINGS_READ","entidad",tenant); return result; });
    }
    @PostMapping("/appointments/{id}/confirm") public Object confirm(Principal p,@PathVariable UUID tenant,@PathVariable UUID id,@RequestHeader(value="If-Match",required=false) String version) {
        return tx.run(tenant,actor(p),() -> service.confirm(tenant,actor(p),id,expected(version)));
    }
    @PostMapping("/appointments/{id}/cancel") public Object cancel(Principal p,@PathVariable UUID tenant,@PathVariable UUID id,@Valid @RequestBody CancelInput b,@RequestHeader(value="If-Match",required=false) String version) {
        return tx.run(tenant,actor(p),() -> service.cancel(tenant,actor(p),id,b.reason(),expected(version)));
    }
    @PostMapping("/appointments/{id}/reschedule") public Object reschedule(Principal p,@PathVariable UUID tenant,@PathVariable UUID id,@RequestHeader("Idempotency-Key") String key,@Valid @RequestBody HoldInput b,@RequestHeader(value="If-Match",required=false) String version) {
        return tx.run(tenant,actor(p),() -> service.reschedule(tenant,actor(p),id,key,b,expected(version)));
    }
    private static long expected(String value) {
        if(value==null)throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.PRECONDITION_REQUIRED,"If-Match es requerido para modificar un turno.");
        if(!value.matches("\"[1-9][0-9]{0,17}\""))throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST,"If-Match debe contener la versión entre comillas.");
        return Long.parseLong(value.substring(1,value.length()-1));
    }
    @PostMapping("/agendas/{agenda}/absences") public void absence(Principal p,@PathVariable UUID tenant,@PathVariable UUID agenda,@RequestHeader("Idempotency-Key") String key,@Valid @RequestBody AbsenceInput b) {
        tx.run(tenant,actor(p),() -> { service.absence(tenant,actor(p),agenda,b,key); return null; });
    }
    @GetMapping("/rescheduling-cases") public Object cases(Principal p,@PathVariable UUID tenant,@RequestParam UUID agendaId) {
        return tx.run(tenant,actor(p),() -> { auth.requireAgenda(actor(p),agendaId,"booking:reschedule");return db.list("select a.*,v.turno_id,pp.paciente_id,v.inicio_atencion from turno_afectado a join version_turno v on v.id=a.version_original_id and v.tenant_id=a.tenant_id join turno t on t.id=v.turno_id and t.tenant_id=v.tenant_id join paciente_profesional pp on pp.id=t.paciente_profesional_id and pp.tenant_id=t.tenant_id where v.agenda_id=? order by a.id desc limit 100",agendaId); });
    }
    @PostMapping("/management-requests") public Object management(Principal p,@PathVariable UUID tenant,@Valid @RequestBody ManagementInput b) {
        return tx.run(tenant,actor(p),() -> {
            var a=db.one("select id from agenda where profesional_entidad_id=? order by id limit 1",b.professionalEntityId());
            auth.booking(actor(p),b.patientId(),Db.uuid(a,"id"),"booking:create");
            UUID id=db.id("insert into solicitud_gestion(tenant_id,paciente_id,profesional_entidad_id,practica_id,solicitante_id,motivo,estado,creada_en) values (?,?,?,?,?,?,'PENDIENTE',now()) returning id",tenant,b.patientId(),b.professionalEntityId(),b.practiceId(),actor(p),b.reason());
            audit.record(tenant,actor(p),"MANAGEMENT_REQUESTED","solicitud_gestion",id); return Map.of("id",id); });
    }
    @GetMapping("/management-requests") public Object requests(Principal p,@PathVariable UUID tenant,@RequestParam UUID agendaId) {
        return tx.run(tenant,actor(p),() -> {auth.requireAgenda(actor(p),agendaId,"booking:create");
            return db.list("select s.* from solicitud_gestion s join agenda a on a.profesional_entidad_id=s.profesional_entidad_id and a.tenant_id=s.tenant_id where a.id=? order by s.id desc limit 100",agendaId);});
    }
    @PostMapping("/management-requests/{id}/resolve") public void resolve(Principal p,@PathVariable UUID tenant,@PathVariable UUID id,@RequestParam UUID agendaId) {
        tx.run(tenant,actor(p),() -> {auth.requireAgenda(actor(p),agendaId,"booking:create");
            db.update("update solicitud_gestion s set estado='RESUELTA',responsable_id=?,resuelta_en=now() from agenda a where s.id=? and a.id=? and a.profesional_entidad_id=s.profesional_entidad_id and a.tenant_id=s.tenant_id",actor(p),id,agendaId);
            audit.record(tenant,actor(p),"MANAGEMENT_RESOLVED","solicitud_gestion",id);return null;});
    }
}
