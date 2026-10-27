package ar.com.salud.organization;

import ar.com.salud.audit.Audit;
import ar.com.salud.identity.IdentityService;
import ar.com.salud.shared.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.security.Principal;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

/** Account onboarding and consent. Directory projections deliberately contain no patient data. */
@RestController @RequestMapping("/api/v1")
public class StaffExperienceController {
    private final Db db; private final TenantTransactions tx; private final Authorization auth;
    private final IdentityService identity; private final Audit audit;
    public StaffExperienceController(Db db,TenantTransactions tx,Authorization auth,IdentityService identity,Audit audit) {
        this.db=db;this.tx=tx;this.auth=auth;this.identity=identity;this.audit=audit;
    }
    private UUID actor(Principal p) { return UUID.fromString(p.getName()); }
    private void accountContext(Principal p) {db.jdbc.queryForObject("select set_config('app.actor_id',?,true)",String.class,actor(p).toString());}
    private void member(Principal p) {db.one("select id from membresia where cuenta_id=? and estado='ACTIVA' and desde<=now() and (hasta is null or hasta>now())",actor(p));}
    public record NewStaff(@NotBlank @Size(max=150) String name,@NotBlank @Email @Size(max=254) String email,
        @NotBlank @Pattern(regexp="PROFESIONAL|SECRETARIA") String role,@Size(max=100) String registration) {}
    public record LinkInput(@NotNull UUID institutionId,@NotBlank @Size(max=150) String name,@NotBlank @Size(max=100) String registration) {}
    public record Decision(boolean approve) {}
    public record Profile(@NotBlank @Size(max=80) String firstName,@NotBlank @Size(max=80) String lastName,
        @Size(max=30) String document,@Size(max=300) String address,@Size(max=40) String phone,
        @Size(max=280000) String photo) {}
    public record Reception(@NotBlank @Pattern(regexp="ESPERA|ATENCION|FINALIZADO") String state) {}
    @GetMapping("/account/staff-notices") @Transactional public Object notices(Principal p) {
        accountContext(p);
        return db.list("select n.id,n.tipo,n.creado_en,n.leido_en,e.nombre institucion from aviso_cuenta_staff n join entidad e on e.id=n.tenant_id where n.cuenta_id=? order by n.creado_en desc limit 100",actor(p));
    }
    @PostMapping("/account/staff-notices/{id}/read") @Transactional public void readNotice(Principal p,@PathVariable UUID id) {
        accountContext(p);
        db.update("update aviso_cuenta_staff set leido_en=coalesce(leido_en,now()) where id=? and cuenta_id=?",id,actor(p));
    }
    @GetMapping("/account/profile") public Object profile(Principal p) {
        return db.one("select perfil::text profile from cuenta where id=?",actor(p));
    }
    @PutMapping("/account/profile") @Transactional public void profile(Principal p,@Valid @RequestBody Profile b) {
        if(b.firstName().isBlank() || b.lastName().isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Completá nombre y apellido.");
        if(b.photo()!=null && !b.photo().isEmpty() && !b.photo().matches("data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Usá una imagen PNG, JPEG o WebP.");
        db.update("update cuenta set nombre=?,perfil=jsonb_build_object('firstName',?::text,'lastName',?::text,'document',?::text,'address',?::text,'phone',?::text,'photo',?::text,'complete',true) where id=?",
            b.firstName().trim()+" "+b.lastName().trim(),b.firstName().trim(),b.lastName().trim(),b.document(),b.address(),b.phone(),b.photo(),actor(p));
    }
    @PostMapping("/entities/{tenant}/staff-accounts") public Object create(Principal p,@PathVariable UUID tenant,@Valid @RequestBody NewStaff b) {
        return tx.run(tenant,actor(p),()->{
            auth.require(actor(p),"members:manage");
            if(b.role().equals("PROFESIONAL")) { auth.require(actor(p),"professionals:manage"); if(b.registration()==null || b.registration().isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Registrá la matrícula verificada."); }
            var result=identity.provisional(b.name().trim(),b.email().trim()); UUID account=(UUID)result.get("id");
            UUID member=db.id("insert into membresia(tenant_id,cuenta_id,desde,estado) values (?,?,now(),'ACTIVA') returning id",tenant,account);
            if(b.role().equals("PROFESIONAL")) linkProfessional(tenant,account,member,b.name().trim(),b.registration());
            audit.record(tenant,actor(p),"STAFF_ACCOUNT_CREATED","membresia",member); return result;
        });
    }
    @PostMapping("/account/institution-requests") @Transactional public Object requestInstitution(Principal p,@Valid @RequestBody LinkInput b) {
        accountContext(p);
        // A request is submitted by the professional, never by the receiving administrator.
        db.one("select id from profesional_global where cuenta_id=? and estado='ACTIVO'",actor(p));
        db.one("select id from entidad where id=? and tipo='CLINICA' and estado='ACTIVA'",b.institutionId());
        if(db.exists("select 1 from my_contexts(?) where id=?",actor(p),b.institutionId())) throw new ResponseStatusException(HttpStatus.CONFLICT,"Ya tenés un vínculo con esa institución.");
        UUID id=db.id("insert into solicitud_vinculo_staff(tenant_id,solicitante_id,tipo,nombre,matricula) values (?,?,'INSTITUCION',?,?) returning id",b.institutionId(),actor(p),b.name(),b.registration());
        return Map.of("id",id);
    }
    @GetMapping("/account/institution-requests") @Transactional public Object myRequests(Principal p) {
        accountContext(p);
        return db.list("select s.id,s.nombre,s.estado,e.nombre institucion from solicitud_vinculo_staff s join entidad e on e.id=s.tenant_id where s.solicitante_id=? and s.tipo='INSTITUCION' order by s.creada_en desc limit 100",actor(p));
    }
    @GetMapping("/entities/{tenant}/staff-directory") public Object directory(Principal p,@PathVariable UUID tenant) {
        return tx.run(tenant,actor(p),()->{
            member(p);
            var people=db.list("""
                select pe.id,pg.nombre_referencia nombre,pg.matricula_referencia matricula,
                a.id agenda_id,a.nombre agenda,s.nombre sede,a.zona_horaria,
                coalesce((select r.estado from solicitud_vinculo_staff r where r.tenant_id=pe.tenant_id and r.agenda_id=a.id and r.solicitante_id=? and r.tipo='AGENDA' order by r.creada_en desc limit 1),'') solicitud
                from profesional_entidad pe join profesional_global pg on pg.id=pe.profesional_id
                join membresia m on m.id=pe.membresia_id and m.tenant_id=pe.tenant_id
                left join agenda a on a.profesional_entidad_id=pe.id and a.tenant_id=pe.tenant_id and a.estado='ACTIVA'
                left join sede s on s.id=a.sede_id and s.tenant_id=a.tenant_id
                where pe.estado='ACTIVO' and m.estado='ACTIVA' and m.desde<=now() and (m.hasta is null or m.hasta>now()) order by pg.nombre_referencia,a.id
                """,actor(p));
            for(var person:people) person.put("hours",person.get("agenda_id")==null?List.of():db.list("select dia_semana,hora_inicio,hora_fin,desde,hasta from horario_agenda where agenda_id=? and (hasta is null or hasta>=current_date) order by dia_semana,hora_inicio",person.get("agenda_id")));
            return people;
        });
    }
    @GetMapping("/entities/{tenant}/staff-requests") public Object requests(Principal p,@PathVariable UUID tenant) {
        return tx.run(tenant,actor(p),()->db.list("""
            select r.* from solicitud_vinculo_staff r where r.tenant_id=? and r.estado='PENDIENTE' and
            ((r.tipo='INSTITUCION' and ?::boolean) or (r.tipo='AGENDA' and exists(select 1 from agenda a join profesional_entidad pe on pe.id=a.profesional_entidad_id join profesional_global pg on pg.id=pe.profesional_id where a.id=r.agenda_id and a.tenant_id=r.tenant_id and pg.cuenta_id=?)))
            order by r.creada_en limit 200
            """,tenant,auth.staff(actor(p),"professionals:manage"),actor(p)));
    }
    @PostMapping("/entities/{tenant}/agendas/{agenda}/access-requests") public Object requestAgenda(Principal p,@PathVariable UUID tenant,@PathVariable UUID agenda) {
        return tx.run(tenant,actor(p),()->{
            member(p);
            if(auth.institutionAdmin(actor(p))) throw new org.springframework.security.access.AccessDeniedException("La administración institucional no opera agendas.");
            db.one("select a.id from agenda a join profesional_entidad pe on pe.id=a.profesional_entidad_id and pe.tenant_id=a.tenant_id where a.id=? and a.estado='ACTIVA' and pe.estado='ACTIVO'",agenda);
            if(auth.agenda(actor(p),agenda,"agenda:read")) throw new ResponseStatusException(HttpStatus.CONFLICT,"Ya tenés acceso a esa agenda.");
            String name=(String)db.one("select nombre from cuenta where id=?",actor(p)).get("nombre");
            UUID id=db.id("insert into solicitud_vinculo_staff(tenant_id,solicitante_id,tipo,agenda_id,nombre) values (?,?,'AGENDA',?,?) returning id",tenant,actor(p),agenda,name);
            audit.record(tenant,actor(p),"AGENDA_ACCESS_REQUESTED","solicitud_vinculo_staff",id);return Map.of("id",id);
        });
    }
    @PostMapping("/entities/{tenant}/staff-requests/{id}/resolve") public void resolve(Principal p,@PathVariable UUID tenant,@PathVariable UUID id,@Valid @RequestBody Decision b) {
        tx.run(tenant,actor(p),()->{
            var r=db.one("select * from solicitud_vinculo_staff where id=? and tenant_id=? and estado='PENDIENTE' for update",id,tenant);
            UUID applicant=Db.uuid(r,"solicitante_id");
            if("INSTITUCION".equals(r.get("tipo"))) {
                auth.require(actor(p),"professionals:manage");
                if(b.approve()) {
                    UUID member=db.id("insert into membresia(tenant_id,cuenta_id,desde,estado) values (?,?,now(),'ACTIVA') on conflict(tenant_id,cuenta_id) do update set estado='ACTIVA',hasta=null returning id",tenant,applicant);
                    linkProfessional(tenant,applicant,member,(String)r.get("nombre"),(String)r.get("matricula"));
                }
            } else {
                UUID agenda=Db.uuid(r,"agenda_id");
                var owner=db.one("select pe.id from agenda a join profesional_entidad pe on pe.id=a.profesional_entidad_id and pe.tenant_id=a.tenant_id join profesional_global pg on pg.id=pe.profesional_id where a.id=? and pg.cuenta_id=? and pe.estado='ACTIVO'",agenda,actor(p));
                auth.requireAgenda(actor(p),agenda,"agenda:configure");
                if(b.approve()) {
                    UUID member=Db.uuid(db.one("select id from membresia where cuenta_id=? and estado='ACTIVA' and desde<=now() and (hasta is null or hasta>now())",applicant),"id");
                    UUID delegation=db.id("insert into delegacion_agenda(tenant_id,agenda_id,membresia_id,otorgante_profesional_id,desde) values (?,?,?,?,now()) returning id",tenant,agenda,member,owner.get("id"));
                    for(String perm:List.of("agenda:read","booking:read","booking:create","booking:confirm","booking:cancel","booking:reschedule"))
                        db.update("insert into delegacion_permiso(tenant_id,delegacion_id,permiso_id) select ?,?,id from permiso where codigo=?",tenant,delegation,perm);
                }
            }
            db.update("update solicitud_vinculo_staff set estado=?,resuelta_en=now(),revisor_id=? where id=?",b.approve()?"APROBADA":"RECHAZADA",actor(p),id);
            db.update("insert into aviso_cuenta_staff(cuenta_id,tenant_id,tipo) values (?,?,?)",applicant,tenant,b.approve()?"SOLICITUD_APROBADA":"SOLICITUD_RECHAZADA");
            db.update("insert into aviso_interno(tenant_id,destinatario_id,tipo,clave_logica,creado_en) values (?,?,?, ?,now())",tenant,applicant,b.approve()?"STAFF_REQUEST_APPROVED":"STAFF_REQUEST_REJECTED","staff-request:"+id);
            audit.record(tenant,actor(p),"STAFF_REQUEST_RESOLVED","solicitud_vinculo_staff",id);return null;
        });
    }
    private void linkProfessional(UUID tenant,UUID account,UUID member,String name,String registration) {
        UUID global=db.id("insert into profesional_global(cuenta_id,nombre_referencia,matricula_referencia,estado) values (?,?,?,'ACTIVO') on conflict(cuenta_id) do update set cuenta_id=excluded.cuenta_id returning id",account,name,registration);
        db.update("insert into profesional_entidad(tenant_id,profesional_id,membresia_id,desde,estado) values (?,?,?,now(),'ACTIVO') on conflict(tenant_id,profesional_id) do update set membresia_id=excluded.membresia_id,estado='ACTIVO',hasta=null",tenant,global,member);
    }
    @GetMapping("/entities/{tenant}/reception") public Object reception(Principal p,@PathVariable UUID tenant,@RequestParam UUID agendaId) {
        return tx.run(tenant,actor(p),()->{auth.requireAgenda(actor(p),agendaId,"booking:read");return db.list("select r.turno_id,r.estado from recepcion_turno r join version_turno v on v.turno_id=r.turno_id and v.tenant_id=r.tenant_id and v.sustituida_en is null where v.agenda_id=? and v.inicio_atencion>=now()-interval '2 days' and v.inicio_atencion<now()+interval '2 days'",agendaId);});
    }
    @PutMapping("/entities/{tenant}/appointments/{id}/reception") public void reception(Principal p,@PathVariable UUID tenant,@PathVariable UUID id,@Valid @RequestBody Reception b) {
        tx.run(tenant,actor(p),()->{
            var turn=db.one("select v.agenda_id from turno t join version_turno v on v.turno_id=t.id and v.tenant_id=t.tenant_id and v.sustituida_en is null where t.id=? and t.estado_turno='REGISTRADO' for update of t",id);
            auth.requireAgenda(actor(p),Db.uuid(turn,"agenda_id"),"booking:confirm");
            db.update("insert into recepcion_turno(tenant_id,turno_id,estado,actor_id) values (?,?,?,?) on conflict(turno_id) do update set estado=excluded.estado,actor_id=excluded.actor_id,actualizada_en=now()",tenant,id,b.state(),actor(p));
            audit.record(tenant,actor(p),"RECEPTION_UPDATED","turno",id);return null;
        });
    }
}
