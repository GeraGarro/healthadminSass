package ar.com.salud.organization;

import ar.com.salud.audit.Audit;
import ar.com.salud.scheduling.BookingService;
import ar.com.salud.shared.*;
import jakarta.validation.constraints.*;
import java.security.Principal;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/** Purpose-limited, paged projections. Booking access never grants access to a complete patient file. */
@RestController
@RequestMapping("/api/v1/entities/{tenant}/workspace")
public class WorkspaceQueryController {
    private final Db db; private final TenantTransactions tx; private final Authorization auth;
    private final BookingService bookings; private final Audit audit;
    public WorkspaceQueryController(Db db,TenantTransactions tx,Authorization auth,BookingService bookings,Audit audit) {
        this.db=db;this.tx=tx;this.auth=auth;this.bookings=bookings;this.audit=audit;
    }
    private static UUID actor(Principal p){return UUID.fromString(p.getName());}
    private Map<String,Object> page(String sql,String count,int offset,int limit,Object... args) {
        var parameters=new ArrayList<Object>(Arrays.asList(args));parameters.add(limit);parameters.add(offset);
        return Map.of("items",db.list(sql+" limit ? offset ?",parameters.toArray()),
            "total",((Number)db.one("select n from ("+count+") counted(n)",args).get("n")).longValue(),"offset",offset,"limit",limit);
    }

    @GetMapping("/lists/{resource}")
    public Object list(Principal p,@PathVariable UUID tenant,@PathVariable String resource,
            @RequestParam(required=false) UUID agendaId,@RequestParam(defaultValue="0") @Min(0) int offset,
            @RequestParam(defaultValue="250") @Min(1) @Max(500) int limit) {
        return tx.run(tenant,actor(p),()->{
            String select,joins,order="id";Object[] args=new Object[0];
            switch(resource){
                case "institution-professionals" -> {
                    auth.require(actor(p),"professionals:manage");
                    select="pe.id,pe.membresia_id,pg.cuenta_id,pg.nombre_referencia nombre,pg.matricula_referencia matricula,pe.estado,pe.desde,pe.hasta";
                    joins="from profesional_entidad pe join profesional_global pg on pg.id=pe.profesional_id";order="pg.nombre_referencia,pe.id";
                }
                case "institution-members" -> {
                    auth.require(actor(p),"members:manage");
                    select="m.id,m.cuenta_id,m.estado,c.nombre,c.email_acceso,coalesce((select string_agg(distinct p.codigo,',') from membresia_permiso mp join permiso p on p.id=mp.permiso_id where mp.membresia_id=m.id and mp.tenant_id=m.tenant_id and mp.revocada_en is null and mp.desde<=now() and (mp.hasta is null or mp.hasta>now())), '') permisos";
                    joins="from membresia m join cuenta c on c.id=m.cuenta_id";order="c.nombre,m.id";
                }
                case "institution-branches" -> {auth.require(actor(p),"professionals:manage");select="id,nombre,direccion,zona_horaria,estado";joins="from sede";order="nombre,id";}
                case "institution-agendas" -> {auth.require(actor(p),"professionals:manage");select="id,nombre,profesional_entidad_id,sede_id,zona_horaria,estado";joins="from agenda";order="nombre,id";}
                case "institution-audit" -> {auth.require(actor(p),"audit:read");select="id,actor_id,servicio_actor,accion,recurso_tipo,recurso_ref,ocurrido_en,resultado";joins="from auditoria_entidad where recurso_tipo in ('entidad','membresia','profesional_entidad','sede','agenda','politica_operativa','solicitud_vinculo_staff')";order="id desc";}
                case "practices" -> {select="p.*,v.nombre";joins="from practica p join version_practica v on v.practica_id=p.id and v.tenant_id=p.tenant_id where v.numero_version=(select max(numero_version) from version_practica where practica_id=p.id)";order="p.codigo_local,p.id";}
                case "coverages" -> {select="id,nombre,estado";joins="from cobertura_medica";order="nombre,id";}
                case "notifications" -> {auth.requireCare(actor(p));select="id,tipo,version_turno_id,creado_en,leido_en,resuelto_en";joins="from aviso_interno where destinatario_id=?";args=new Object[]{actor(p)};}
                case "tasks" -> {auth.require(actor(p),"notifications:manage");select="id,tipo,programada_en,estado,intentos,ultimo_error";joins="from tarea_persistida";}
                case "admissions" -> {auth.require(actor(p),"admissions:manage");select="*";joins="from solicitud_admision";}
                case "plans" -> {auth.require(actor(p),"coverage:manage");select="id,cobertura_id,nombre,estado";joins="from plan_cobertura";order="nombre,id";}
                case "agreements" -> {auth.require(actor(p),"coverage:manage");select="c.id,c.cobertura_id,c.oferta_id,c.plan_id,v.desde,v.hasta,v.requiere_autorizacion";joins="from convenio c join version_convenio v on v.convenio_id=c.id and v.tenant_id=c.tenant_id where c.estado='ACTIVO' and v.numero_version=(select max(x.numero_version) from version_convenio x where x.convenio_id=c.id)";order="c.id";}
                case "management-requests", "rescheduling-cases", "offers", "hours" -> {
                    if(agendaId==null)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"agendaId requerido.");
                    auth.requireAgenda(actor(p),agendaId,switch(resource){case "management-requests"->"booking:create";case "rescheduling-cases"->"booking:reschedule";default->"agenda:read";});
                    args=new Object[]{agendaId};
                    if(resource.equals("management-requests")){select="s.*";joins="from solicitud_gestion s join agenda a on a.profesional_entidad_id=s.profesional_entidad_id and a.tenant_id=s.tenant_id where a.id=?";order="s.id";}
                    else if(resource.equals("rescheduling-cases")){select="a.*,v.turno_id,pp.paciente_id,v.inicio_atencion";joins="from turno_afectado a join version_turno v on v.id=a.version_original_id and v.tenant_id=a.tenant_id join turno t on t.id=v.turno_id and t.tenant_id=v.tenant_id join paciente_profesional pp on pp.id=t.paciente_profesional_id and pp.tenant_id=t.tenant_id where v.agenda_id=?";order="a.id";}
                    else if(resource.equals("hours")){select="*";joins="from horario_agenda where agenda_id=?";order="dia_semana,hora_inicio,id";}
                    else {select="v.*,o.practica_id,vp.nombre";joins="from version_oferta v join oferta o on o.id=v.oferta_id and o.tenant_id=v.tenant_id join version_practica vp on vp.id=v.version_practica_id and vp.tenant_id=v.tenant_id where o.agenda_id=? and o.estado='ACTIVA' and v.desde<=now() and (v.hasta is null or v.hasta>now())";order="v.id";}
                }
                default -> throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Listado no disponible.");
            }
            return page("select "+select+" "+joins+" order by "+order,"select count(*) "+joins,offset,limit,args);
        });
    }
    @GetMapping("/appointments")
    public Object appointments(Principal p,@PathVariable UUID tenant,@RequestParam UUID agendaId,
            @RequestParam LocalDate from,@RequestParam LocalDate until,
            @RequestParam(defaultValue="0") @Min(0) int offset,@RequestParam(defaultValue="250") @Min(1) @Max(500) int limit) {
        return tx.run(tenant,actor(p),()->{
            auth.requireAgenda(actor(p),agendaId,"booking:read");
            if(!until.isAfter(from)||ChronoUnit.DAYS.between(from,until)>93)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"El rango debe abarcar de 1 a 93 días; hasta es exclusivo.");
            var zone=ZoneId.of((String)db.one("select zona_horaria from agenda where id=?",agendaId).get("zona_horaria"));
            Instant start=from.atStartOfDay(zone).toInstant(),end=until.atStartOfDay(zone).toInstant();
            String joins="""
                from turno t join version_turno v on v.turno_id=t.id and v.tenant_id=t.tenant_id and v.sustituida_en is null
                join paciente_profesional pp on pp.id=t.paciente_profesional_id and pp.tenant_id=t.tenant_id
                join paciente p on p.id=pp.paciente_id and p.tenant_id=pp.tenant_id
                join version_oferta vo on vo.id=v.version_oferta_id and vo.tenant_id=v.tenant_id
                join version_practica vp on vp.id=vo.version_practica_id and vp.tenant_id=vo.tenant_id
                join evaluacion_elegibilidad ev on ev.id=v.elegibilidad_id and ev.tenant_id=v.tenant_id
                where v.agenda_id=? and v.inicio_atencion>=? and v.inicio_atencion<?
                """;
            audit.record(tenant,actor(p),"WORKSPACE_APPOINTMENTS_READ","agenda",agendaId);
            return page("select t.id,t.estado_turno,t.estado_asistencia,t.version_concurrencia,v.agenda_id,v.version_oferta_id,v.numero_version,v.inicio_atencion,v.fin_atencion,v.zona_horaria,pp.paciente_id,pp.numero_visible,p.nombres,p.apellidos,vp.nombre practica,ev.modalidad_elegida "+joins+" order by v.inicio_atencion,t.id",
                "select count(*) "+joins,offset,limit,agendaId,start,end);
        });
    }
    @GetMapping("/directory")
    public Object directory(Principal p,@PathVariable UUID tenant,@RequestParam(defaultValue="0") @Min(0) int offset,
            @RequestParam(defaultValue="250") @Min(1) @Max(500) int limit) {
        return tx.run(tenant,actor(p),()->{
            auth.require(actor(p),"patients:manage");
            audit.record(tenant,actor(p),"WORKSPACE_DIRECTORY_READ","entidad",tenant);
            return page("""
                select p.id,p.nombres,p.apellidos,p.estado,p.documento_declarado,p.nacimiento,p.domicilio,
                (select string_agg(pp.numero_visible::text,' / ' order by pp.profesional_entidad_id) from paciente_profesional pp where pp.paciente_id=p.id and pp.estado='ACTIVO') numeros,
                (select string_agg(pp.profesional_entidad_id::text,',') from paciente_profesional pp where pp.paciente_id=p.id and pp.estado='ACTIVO') profesionales,
                (select cm.nombre from afiliacion_paciente af join cobertura_medica cm on cm.id=af.cobertura_id and cm.tenant_id=af.tenant_id where af.paciente_id=p.id and af.estado_verificacion='VERIFICADA' order by af.id desc limit 1) cobertura
                from paciente p order by p.apellidos,p.id
                ""","select count(*) from paciente",offset,limit);
        });
    }
    @GetMapping("/agendas/{agenda}/booking-patients")
    public Object candidates(Principal p,@PathVariable UUID tenant,@PathVariable UUID agenda,
            @RequestParam(defaultValue="") @Size(max=100) String q,
            @RequestParam(defaultValue="0") @Min(0) int offset,@RequestParam(defaultValue="100") @Min(1) @Max(200) int limit) {
        return tx.run(tenant,actor(p),()->{
            if(!auth.agenda(actor(p),agenda,"booking:create")&&!auth.agenda(actor(p),agenda,"booking:reschedule"))throw new org.springframework.security.access.AccessDeniedException("Sin facultad de coordinación");
            String normalized=java.text.Normalizer.normalize(q,java.text.Normalizer.Form.NFD).replaceAll("\\p{M}","").toLowerCase(Locale.ROOT);
            String joins="""
                from paciente p join paciente_profesional pp on pp.paciente_id=p.id and pp.tenant_id=p.tenant_id
                join agenda a on a.profesional_entidad_id=pp.profesional_entidad_id and a.tenant_id=pp.tenant_id
                where a.id=? and p.estado='ACTIVO' and pp.estado='ACTIVO'
                and position(? in translate(lower(concat_ws(' ',p.nombres,p.apellidos,p.documento_declarado,pp.numero_visible::text)),'áéíóúüñ','aeiouun'))>0
                """;
            audit.record(tenant,actor(p),"BOOKING_PATIENTS_READ","agenda",agenda);
            return page("select p.id,p.nombres,p.apellidos,pp.numero_visible "+joins+" order by p.apellidos,p.id","select count(*) "+joins,offset,limit,agenda,normalized);
        });
    }
    @GetMapping("/agendas/{agenda}/booking-patients/{patient}/eligibility")
    public Object eligibility(Principal p,@PathVariable UUID tenant,@PathVariable UUID agenda,@PathVariable UUID patient,
            @RequestParam UUID offerVersionId,@RequestParam LocalDate date,@RequestParam(required=false) UUID appointmentId) {
        return tx.run(tenant,actor(p),()->{
            bookings.authorizeScheduling(actor(p),patient,agenda,appointmentId);
            var offer=bookings.offer(offerVersionId);
            if(!agenda.equals(offer.get("agenda_id")))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"La oferta no corresponde a la agenda.");
            db.one("select pp.id from paciente_profesional pp join paciente p on p.id=pp.paciente_id and p.tenant_id=pp.tenant_id where pp.paciente_id=? and pp.profesional_entidad_id=? and pp.estado='ACTIVO' and p.estado='ACTIVO'",patient,offer.get("profesional_entidad_id"));
            var zone=ZoneId.of((String)offer.get("zona_horaria"));Instant start=date.atStartOfDay(zone).toInstant(),end=date.plusDays(1).atStartOfDay(zone).toInstant();
            // Only verified affiliations with a potentially applicable agreement are exposed for this booking.
            var affiliations=db.list("""
                select af.id,cm.nombre,af.numero_afiliado,af.estado_verificacion,af.desde,af.hasta,
                exists(select 1 from convenio c join version_convenio v on v.convenio_id=c.id and v.tenant_id=c.tenant_id
                  where c.oferta_id=? and c.cobertura_id=af.cobertura_id and (c.plan_id is null or c.plan_id=af.plan_id)
                  and c.estado='ACTIVO' and v.resultado_regla='PERMITIDA' and v.desde<? and (v.hasta is null or v.hasta>?) and v.requiere_autorizacion) requiere_autorizacion
                from afiliacion_paciente af join cobertura_medica cm on cm.id=af.cobertura_id and cm.tenant_id=af.tenant_id
                where af.paciente_id=? and af.estado_verificacion='VERIFICADA' and (af.desde is null or af.desde<=?) and (af.hasta is null or af.hasta>=?)
                and exists(select 1 from convenio c join version_convenio v on v.convenio_id=c.id and v.tenant_id=c.tenant_id
                  where c.oferta_id=? and c.cobertura_id=af.cobertura_id and (c.plan_id is null or c.plan_id=af.plan_id)
                  and c.estado='ACTIVO' and v.resultado_regla='PERMITIDA' and v.desde<? and (v.hasta is null or v.hasta>?)) order by cm.nombre,af.id
                """,offer.get("oferta_id"),end,start,patient,date,date,offer.get("oferta_id"),end,start);
            var authorizations=db.list("""
                select ac.id,ac.afiliacion_id,ac.practica_id,ac.referencia,ac.estado,ac.desde,ac.hasta
                from autorizacion_cobertura ac join afiliacion_paciente af on af.id=ac.afiliacion_id and af.tenant_id=ac.tenant_id
                where af.paciente_id=? and ac.practica_id=? and ac.estado='VERIFICADA' and ac.desde<? and ac.hasta>? order by ac.id
                """,patient,offer.get("practica_id"),end,start);
            audit.record(tenant,actor(p),"BOOKING_ELIGIBILITY_READ","agenda",agenda);
            return Map.of("affiliations",affiliations,"authorizations",authorizations,"privatePaymentEnabled",offer.get("particular_habilitado"));
        });
    }
}
