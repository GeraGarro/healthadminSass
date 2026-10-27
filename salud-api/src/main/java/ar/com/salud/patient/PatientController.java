package ar.com.salud.patient;

import ar.com.salud.audit.Audit;
import ar.com.salud.identity.IdentityService;
import ar.com.salud.organization.Authorization;
import ar.com.salud.shared.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.security.Principal;
import java.time.*;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/v1")
public class PatientController {
    private final Db db; private final TenantTransactions tx; private final Authorization auth; private final Audit audit; private final IdentityService identity;
    private final PatientIdentityRegistry registry;
    public PatientController(Db db,TenantTransactions tx,Authorization auth,Audit audit,IdentityService identity,PatientIdentityRegistry registry) {
        this.db=db; this.tx=tx; this.auth=auth; this.audit=audit; this.identity=identity;this.registry=registry;
    }
    public record PatientInput(@NotBlank @Size(max=100) String firstName,@NotBlank @Size(max=100) String lastName,
        @Size(max=30) String document,@PastOrPresent LocalDate birthDate,@Size(max=300) String address) {}
    public record AdmissionRequest(@NotNull @Valid PatientInput patient,@NotNull UUID professionalEntityId) {}
    public record LinkInput(@NotNull UUID professionalEntityId) {}
    public record AccessInput(@NotNull UUID accountId,@NotNull UUID professionalEntityId,UUID agendaId,
        @NotBlank @Size(max=300) String verificationReference,UUID representationId) {}
    public record RepresentationInput(@NotNull UUID accountId,@NotBlank @Size(max=300) String evidence,
        @NotEmpty Set<String> permissions,@NotNull @Future Instant until) {}
    public record ContactInput(@Pattern(regexp="EMAIL|WHATSAPP") @NotNull String type,@NotBlank @Size(max=254) String value,
        @NotBlank @Size(max=300) String authorizationReference) {}
    public record CoverageInput(@NotBlank @Size(max=150) String name) {}
    public record AuthorizationInput(@NotNull UUID affiliationId,@NotNull UUID practiceId,@NotBlank @Size(max=200) String reference,@NotNull Instant from,@NotNull Instant until) {}
    public record AffiliationInput(@NotNull UUID coverageId,UUID planId,@NotBlank @Size(max=100) String memberNumber,
        @NotNull LocalDate from,LocalDate until,@NotBlank @Size(max=200) String verificationReference) {}
    public record AgreementInput(@NotNull UUID offerId,@NotNull UUID coverageId,UUID planId,
        @NotNull Instant from,Instant until,boolean requiresAuthorization) {}
    private static UUID actor(Principal p) { return UUID.fromString(p.getName()); }
    @GetMapping("/my-patients/{tenant}") public Object mine(Principal p,@PathVariable UUID tenant) {
        return tx.run(tenant,actor(p),() -> db.list("select distinct p.id,p.nombres,p.apellidos from acceso_paciente a join paciente p on p.id=a.paciente_id and p.tenant_id=a.tenant_id where a.cuenta_id=? and a.estado='ACTIVO' and a.activado_en is not null",actor(p)).stream()
            .filter(r -> auth.patient(actor(p),Db.uuid(r,"id"),null,"patient:read")).toList());
    }
    @PostMapping("/admission-requests/{tenant}")
    public Object request(Principal p,@PathVariable UUID tenant,@Valid @RequestBody AdmissionRequest b) {
        UUID actor=actor(p); identity.throttle("admission:"+actor,10);
        return tx.system(tenant,() -> {
            db.one("select id from entidad where id=? and estado='ACTIVA'",tenant);
            db.one("select id from profesional_entidad where id=? and estado='ACTIVO'",b.professionalEntityId());
            UUID id=db.id("insert into solicitud_admision(tenant_id,solicitante_id,profesional_entidad_id,datos_declarados,estado) values (?,?,?,jsonb_build_object('firstName',?::text,'lastName',?::text,'document',?::text,'birthDate',?::text,'address',?::text),'PENDIENTE') returning id",tenant,actor,b.professionalEntityId(),b.patient().firstName(),b.patient().lastName(),b.patient().document(),b.patient().birthDate()==null?null:b.patient().birthDate().toString(),b.patient().address());
            audit.record(tenant,actor,"ADMISSION_REQUESTED","solicitud_admision",id); return Map.of("id",id,"state","PENDIENTE"); });
    }
    @GetMapping("/entities/{tenant}/admissions")
    public Object requests(Principal p,@PathVariable UUID tenant) {
        return tx.run(tenant,actor(p),() -> { auth.require(actor(p),"admissions:manage");
            return db.list("select * from solicitud_admision order by id desc limit 100"); });
    }
    @PostMapping("/entities/{tenant}/admissions/{id}/approve")
    public Object approve(Principal p,@PathVariable UUID tenant,@PathVariable UUID id,
        @Valid @RequestBody AccessInput b) {
        return tx.run(tenant,actor(p),() -> { auth.require(actor(p),"admissions:manage");
            var req=db.one("select *,datos_declarados->>'firstName' first_name,datos_declarados->>'lastName' last_name,datos_declarados->>'document' document,datos_declarados->>'birthDate' birth_date,datos_declarados->>'address' address from solicitud_admision where id=? and estado='PENDIENTE' for update",id);
            if(!b.accountId().equals(req.get("solicitante_id")) || !b.professionalEntityId().equals(req.get("profesional_entidad_id")))
                throw new ResponseStatusException(HttpStatus.CONFLICT,"La aprobación debe corresponder a la solicitud.");
            String birth=(String)req.get("birth_date");
            UUID patient=create(tenant,actor(p),new PatientInput((String)req.get("first_name"),(String)req.get("last_name"),(String)req.get("document"),birth==null?null:LocalDate.parse(birth),(String)req.get("address")));
            link(tenant,patient,b.professionalEntityId()); access(tenant,actor(p),patient,b,id);
            db.update("update solicitud_admision set estado='APROBADA',paciente_resuelto_id=?,revisor_id=?,resuelta_en=now() where id=?",patient,actor(p),id);
            audit.record(tenant,actor(p),"ADMISSION_APPROVED","solicitud_admision",id); return Map.of("patientId",patient); });
    }
    @PostMapping("/entities/{tenant}/admissions/{id}/reject")
    public void reject(Principal p,@PathVariable UUID tenant,@PathVariable UUID id) {
        tx.run(tenant,actor(p),() -> { auth.require(actor(p),"admissions:manage");
            db.update("update solicitud_admision set estado='RECHAZADA',revisor_id=?,resuelta_en=now() where id=? and estado='PENDIENTE'",actor(p),id);
            audit.record(tenant,actor(p),"ADMISSION_REJECTED","solicitud_admision",id); return null; });
    }
    @PostMapping("/entities/{tenant}/patients")
    public Object create(Principal p,@PathVariable UUID tenant,@Valid @RequestBody PatientInput b) {
        return tx.run(tenant,actor(p),() -> { auth.require(actor(p),"patients:manage"); return Map.of("id",create(tenant,actor(p),b)); });
    }
    @GetMapping("/entities/{tenant}/patients")
    public Object patients(Principal p,@PathVariable UUID tenant) {
        return tx.run(tenant,actor(p),() -> { auth.require(actor(p),"patients:manage");
            audit.record(tenant,actor(p),"PATIENTS_READ","entidad",tenant);
            return db.list("""
                select p.id,p.nombres,p.apellidos,p.estado,p.documento_declarado,p.nacimiento,p.domicilio,
                    (select string_agg(pp.numero_visible::text,' / ' order by pp.profesional_entidad_id) from paciente_profesional pp where pp.paciente_id=p.id and pp.estado='ACTIVO') numeros,
                    (select string_agg(pp.profesional_entidad_id::text,',') from paciente_profesional pp where pp.paciente_id=p.id and pp.estado='ACTIVO') profesionales,
                    (select cm.nombre from afiliacion_paciente af join cobertura_medica cm on cm.id=af.cobertura_id and cm.tenant_id=af.tenant_id where af.paciente_id=p.id and af.estado_verificacion='VERIFICADA' order by af.id desc limit 1) cobertura
                from paciente p order by p.apellidos,p.id limit 100
                """); });
    }
    @GetMapping("/entities/{tenant}/patients/{id}")
    public Object patient(Principal p,@PathVariable UUID tenant,@PathVariable UUID id) {
        return tx.run(tenant,actor(p),() -> { if(!auth.staff(actor(p),"patients:manage") && !auth.patient(actor(p),id,null,"patient:read"))
                throw new org.springframework.security.access.AccessDeniedException("Sin facultad de ficha");
            audit.record(tenant,actor(p),"PATIENT_READ","paciente",id);
            return Map.of("patient",db.one("select * from paciente where id=?",id),"numbers",db.list("select id,profesional_entidad_id,numero_visible,estado from paciente_profesional where paciente_id=?",id)); });
    }
    @PutMapping("/entities/{tenant}/patients/{id}")
    public void update(Principal p,@PathVariable UUID tenant,@PathVariable UUID id,@Valid @RequestBody PatientInput b) {
        tx.run(tenant,actor(p),() -> { auth.require(actor(p),"patients:manage"); db.one("select id from paciente where id=?",id);
            db.update("update paciente set nombres=?,apellidos=?,documento_declarado=?,nacimiento=?,domicilio=? where id=?",b.firstName(),b.lastName(),b.document(),b.birthDate(),b.address(),id);
            audit.record(tenant,actor(p),"PATIENT_UPDATED","paciente",id); return null; });
    }
    @PostMapping("/entities/{tenant}/patients/{id}/professionals")
    public Object link(Principal p,@PathVariable UUID tenant,@PathVariable UUID id,@Valid @RequestBody LinkInput b) {
        return tx.run(tenant,actor(p),() -> { auth.require(actor(p),"patients:manage");
            UUID linked=link(tenant,id,b.professionalEntityId()); audit.record(tenant,actor(p),"PATIENT_LINKED","paciente_profesional",linked);
            return db.one("select id,numero_visible from paciente_profesional where id=?",linked); });
    }
    @PostMapping("/entities/{tenant}/patients/{id}/access")
    public Object access(Principal p,@PathVariable UUID tenant,@PathVariable UUID id,@Valid @RequestBody AccessInput b) {
        return tx.run(tenant,actor(p),() -> { auth.require(actor(p),"admissions:manage");
            link(tenant,id,b.professionalEntityId()); UUID access=access(tenant,actor(p),id,b,null);
            audit.record(tenant,actor(p),"ACCESS_APPROVED","acceso_paciente",access); return Map.of("id",access); });
    }
    @DeleteMapping("/entities/{tenant}/patients/{patient}/access/{id}")
    public void revoke(Principal p,@PathVariable UUID tenant,@PathVariable UUID patient,@PathVariable UUID id) {
        tx.run(tenant,actor(p),() -> { auth.require(actor(p),"admissions:manage");
            db.update("update acceso_paciente set estado='REVOCADO' where id=? and paciente_id=?",id,patient);
            audit.record(tenant,actor(p),"ACCESS_REVOKED","acceso_paciente",id); return null; });
    }
    @PostMapping("/entities/{tenant}/patients/{id}/representations")
    public Object represent(Principal p,@PathVariable UUID tenant,@PathVariable UUID id,@Valid @RequestBody RepresentationInput b) {
        return tx.run(tenant,actor(p),() -> { auth.require(actor(p),"admissions:manage");
            UUID rep=db.id("insert into representacion(tenant_id,paciente_id,representante_id,tipo,evidencia_ref,verificador_id,desde,hasta) values (?,?,?,'VERIFICADA',?,?,now(),?) returning id",tenant,id,b.accountId(),b.evidence(),actor(p),b.until());
            for(String permission:b.permissions()) {
                if(!Set.of("patient:read","booking:create","booking:read","booking:confirm","booking:cancel","booking:reschedule","chat:read","chat:write").contains(permission)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Facultad de representación inválida.");
                db.update("insert into representacion_permiso(tenant_id,representacion_id,permiso_id) select ?,?,id from permiso where codigo=?",tenant,rep,permission);
            }
            audit.record(tenant,actor(p),"REPRESENTATION_VERIFIED","representacion",rep); return Map.of("id",rep); });
    }
    @DeleteMapping("/entities/{tenant}/patients/{patient}/representations/{id}")
    public void revokeRepresentation(Principal p,@PathVariable UUID tenant,@PathVariable UUID patient,@PathVariable UUID id) {
        tx.run(tenant,actor(p),() -> { auth.require(actor(p),"admissions:manage");
            db.update("update representacion set revocada_en=now() where id=? and paciente_id=?",id,patient);
            audit.record(tenant,actor(p),"REPRESENTATION_REVOKED","representacion",id); return null; });
    }
    @PostMapping("/entities/{tenant}/patients/{id}/contacts")
    public Object contact(Principal p,@PathVariable UUID tenant,@PathVariable UUID id,@Valid @RequestBody ContactInput b) {
        return tx.run(tenant,actor(p),() -> { auth.require(actor(p),"patients:manage");
            UUID contact=db.id("insert into contacto_paciente(tenant_id,paciente_id,tipo,valor,titular_descripcion,verificado_en,estado) values (?,?,?,?,'Verificado por personal autorizado',now(),'ACTIVO') returning id",tenant,id,b.type(),b.value());
            db.update("insert into destino_aviso(tenant_id,paciente_id,contacto_id,canal,proposito,autorizacion_ref,desde) values (?,?,?,?, 'TURNOS',?,now())",tenant,id,contact,b.type(),b.authorizationReference());
            audit.record(tenant,actor(p),"CONTACT_VERIFIED","contacto_paciente",contact); return Map.of("id",contact); });
    }
    @PostMapping("/entities/{tenant}/coverages")
    public Object coverage(Principal p,@PathVariable UUID tenant,@Valid @RequestBody CoverageInput b) {
        return tx.run(tenant,actor(p),() -> { auth.require(actor(p),"coverage:manage");
            UUID id=db.id("insert into cobertura_medica(tenant_id,nombre,estado) values (?,?,'ACTIVA') returning id",tenant,b.name());
            audit.record(tenant,actor(p),"COVERAGE_CREATED","cobertura_medica",id); return Map.of("id",id); });
    }
    @GetMapping("/entities/{tenant}/coverages") public Object coverages(Principal p,@PathVariable UUID tenant) {
        return tx.run(tenant,actor(p),() -> db.list("select id,nombre,estado from cobertura_medica order by nombre limit 200"));
    }
    @PostMapping("/entities/{tenant}/coverages/{id}/plans") public Object plan(Principal p,@PathVariable UUID tenant,@PathVariable UUID id,@Valid @RequestBody CoverageInput b) {
        return tx.run(tenant,actor(p),() -> {auth.require(actor(p),"coverage:manage");
            UUID plan=db.id("insert into plan_cobertura(tenant_id,cobertura_id,nombre,estado) values (?,?,?,'ACTIVO') returning id",tenant,id,b.name());
            audit.record(tenant,actor(p),"COVERAGE_PLAN_CREATED","plan_cobertura",plan);return Map.of("id",plan);});
    }
    @PostMapping("/entities/{tenant}/coverage-authorizations") public Object coverageAuthorization(Principal p,@PathVariable UUID tenant,@Valid @RequestBody AuthorizationInput b) {
        return tx.run(tenant,actor(p),() -> {auth.require(actor(p),"coverage:manage");
            if(!b.until().isAfter(b.from()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Vigencia inválida.");
            UUID id=db.id("insert into autorizacion_cobertura(tenant_id,afiliacion_id,practica_id,referencia,estado,desde,hasta,verificador_id) values (?,?,?,?,'VERIFICADA',?,?,?) returning id",tenant,b.affiliationId(),b.practiceId(),b.reference(),b.from(),b.until(),actor(p));
            audit.record(tenant,actor(p),"COVERAGE_AUTHORIZED","autorizacion_cobertura",id);return Map.of("id",id);});
    }
    @PostMapping("/entities/{tenant}/patients/{id}/affiliations")
    public Object affiliate(Principal p,@PathVariable UUID tenant,@PathVariable UUID id,@Valid @RequestBody AffiliationInput b) {
        return tx.run(tenant,actor(p),() -> { auth.require(actor(p),"coverage:manage");
            if(b.until()!=null&&b.until().isBefore(b.from()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Vigencia inválida.");
            if(b.planId()!=null) db.one("select id from plan_cobertura where id=? and cobertura_id=? and estado='ACTIVO'",b.planId(),b.coverageId());
            UUID affiliation=db.id("insert into afiliacion_paciente(tenant_id,paciente_id,cobertura_id,plan_id,numero_afiliado,desde,hasta,estado_verificacion,verificacion_ref) values (?,?,?,?,?,?,?,'VERIFICADA',?) returning id",tenant,id,b.coverageId(),b.planId(),b.memberNumber(),b.from(),b.until(),b.verificationReference());
            audit.record(tenant,actor(p),"AFFILIATION_VERIFIED","afiliacion_paciente",affiliation); return Map.of("id",affiliation); });
    }
    @PostMapping("/entities/{tenant}/agreements")
    public Object agreement(Principal p,@PathVariable UUID tenant,@Valid @RequestBody AgreementInput b) {
        return tx.run(tenant,actor(p),() -> { auth.require(actor(p),"coverage:manage");
            if(b.until()!=null&&!b.until().isAfter(b.from()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Vigencia inválida.");
            if(b.planId()!=null)db.one("select id from plan_cobertura where id=? and cobertura_id=? and estado='ACTIVO'",b.planId(),b.coverageId());
            UUID id=db.id("insert into convenio(tenant_id,oferta_id,cobertura_id,plan_id,estado) values (?,?,?,?,'ACTIVO') returning id",tenant,b.offerId(),b.coverageId(),b.planId());
            db.update("insert into version_convenio(tenant_id,convenio_id,numero_version,desde,hasta,requiere_autorizacion,resultado_regla,condiciones) values (?,?,1,?,?,?,'PERMITIDA','{}')",tenant,id,b.from(),b.until(),b.requiresAuthorization());
            audit.record(tenant,actor(p),"AGREEMENT_CREATED","convenio",id); return Map.of("id",id); });
    }
    private UUID create(UUID tenant,UUID actor,PatientInput b) {
        UUID id=registry.create(tenant,b.firstName(),b.lastName(),b.document(),b.birthDate(),b.address());
        audit.record(tenant,actor,"PATIENT_CREATED","paciente",id); return id;
    }
    private UUID link(UUID tenant,UUID patient,UUID professional) {
        var pe=db.one("select profesional_id from profesional_entidad where id=? and estado='ACTIVO'",professional);
        db.jdbc.queryForObject("select pg_advisory_xact_lock(hashtextextended(?,0))",Object.class,tenant+":"+pe.get("profesional_id"));
        var existing=db.list("select id from paciente_profesional where profesional_id=? and paciente_id=?",pe.get("profesional_id"),patient);
        if(!existing.isEmpty()) return Db.uuid(existing.getFirst(),"id");
        Integer number=db.jdbc.queryForObject("insert into contador_paciente(tenant_id,profesional_id,profesional_entidad_id,ultimo_confirmado,version) values (?,?,?,1,1) on conflict(tenant_id,profesional_id) do update set ultimo_confirmado=contador_paciente.ultimo_confirmado+1,version=contador_paciente.version+1 returning ultimo_confirmado",Integer.class,tenant,pe.get("profesional_id"),professional);
        return db.id("insert into paciente_profesional(tenant_id,profesional_id,profesional_entidad_id,paciente_id,numero_visible,estado,alta_en) values (?,?,?,?,?,'ACTIVO',now()) returning id",tenant,pe.get("profesional_id"),professional,patient,number);
    }
    private UUID access(UUID tenant,UUID actor,UUID patient,AccessInput b,UUID request) {
        if(b.agendaId()!=null) db.one("select id from agenda where id=? and profesional_entidad_id=?",b.agendaId(),b.professionalEntityId());
        if(b.representationId()!=null) db.one("select id from representacion where id=? and paciente_id=? and representante_id=? and revocada_en is null and hasta>now()",b.representationId(),patient,b.accountId());
        var account=db.one("select estado,email_verificado_en from cuenta where id=?",b.accountId());
        boolean active="ACTIVA".equals(account.get("estado")) && account.get("email_verificado_en")!=null;
        UUID access=db.id("insert into acceso_paciente(tenant_id,paciente_id,cuenta_id,representacion_id,solicitud_id,aprobador_id,aprobado_en,activado_en,estado,vinculacion_ref) values (?,?,?,?,?,?,now(),case when ? then now() else null end,?,?) on conflict(tenant_id,cuenta_id,paciente_id) do update set estado=excluded.estado,activado_en=excluded.activado_en,aprobador_id=excluded.aprobador_id,aprobado_en=now(),representacion_id=excluded.representacion_id returning id",tenant,patient,b.accountId(),b.representationId(),request,actor,active,active?"ACTIVO":"APROBADO",b.verificationReference());
        for(String permission:List.of("patient:read","booking:create","booking:read","booking:confirm","booking:cancel","booking:reschedule","chat:read","chat:write"))
            db.update("insert into alcance_acceso(tenant_id,acceso_id,profesional_entidad_id,agenda_id,permiso_id,desde) select ?,?,?,?,id,now() from permiso where codigo=?",tenant,access,b.professionalEntityId(),b.agendaId(),permission);
        return access;
    }
}
