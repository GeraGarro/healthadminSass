package ar.com.salud.organization;

import ar.com.salud.audit.Audit;
import ar.com.salud.identity.IdentityService;
import ar.com.salud.shared.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.security.Principal;
import java.time.*;
import java.util.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/v1")
public class OrganizationController {
    private final Db db; private final TenantTransactions tx; private final Authorization auth;
    private final IdentityService identity; private final Audit audit;
    public OrganizationController(Db db,TenantTransactions tx,Authorization auth,IdentityService identity,Audit audit) {
        this.db=db; this.tx=tx; this.auth=auth; this.identity=identity; this.audit=audit;
    }
    public record EntityInput(@NotBlank @Size(max=150) String name,@NotBlank String timezone,
        @NotNull UUID administratorId,@Min(1) @Max(30) int holdMinutes,@Min(1) @Max(100) int maxActiveBookings) {}
    public record AccountInput(@NotBlank @Size(max=150) String name,@Email @NotBlank @Size(max=254) String email) {}
    public record MemberInput(@NotNull UUID accountId,@NotNull @Size(max=20) Set<String> permissions) {}
    public record PermissionsInput(@NotNull @Size(max=20) Set<String> permissions) {}
    public record ProfessionalInput(@NotNull UUID accountId,@NotBlank String name,@NotBlank String registration) {}
    public record BranchInput(@NotBlank String name,@NotBlank String timezone,@Size(max=300) String address) {}
    public record AgendaInput(@NotNull UUID professionalEntityId,@NotNull UUID branchId,@NotBlank String name,@NotBlank String timezone) {}
    public record HoursInput(@Min(1) @Max(7) int day,@NotNull LocalTime start,@NotNull LocalTime end,@NotNull LocalDate from,LocalDate until) {}
    public record DelegationInput(@NotNull UUID membershipId,@NotEmpty Set<String> permissions) {}
    public record PracticeInput(@NotBlank @Size(max=80) String code,@NotBlank @Size(max=150) String name) {}
    public record OfferInput(@NotNull UUID practiceId,@Min(1) @Max(480) int durationMinutes,@Min(0) @Max(120) int preparationMinutes,
        @Min(0) @Max(120) int closingMinutes,boolean portalEnabled,boolean privatePaymentEnabled) {}
    public record PolicyInput(@Min(1) @Max(30) int holdMinutes,@Min(1) @Max(100) int maxActiveBookings,
        boolean automaticCloseEnabled,@NotBlank @Size(max=250) String approvalReference) {}
    static UUID actor(Principal p) { return UUID.fromString(p.getName()); }
    @PostMapping("/platform/accounts") @Transactional
    public Map<String,UUID> invite(Principal p,@Valid @RequestBody AccountInput b) {
        auth.platform(actor(p)); return Map.of("id",identity.invite(b.name(),b.email()));
    }
    @PostMapping("/platform/entities") @Transactional
    public Map<String,UUID> entity(Principal p,@Valid @RequestBody EntityInput b) {
        UUID actor=actor(p); auth.platform(actor); ZoneId.of(b.timezone());
        UUID tenant=db.id("insert into entidad(tipo,nombre,zona_horaria,estado,creada_en) values ('CLINICA',?,?,'ACTIVA',now()) returning id",b.name(),b.timezone());
        tx.system(tenant,() -> {
            UUID membership=member(tenant,actor,b.administratorId());
            for(String perm:List.of("members:manage","patients:manage","admissions:manage","catalog:manage","professionals:manage","coverage:manage","policy:manage","audit:read","notifications:manage"))
                grant(tenant,membership,actor,perm);
            String[] codes={"CONSULTA","EXTRACCION","LIMPIEZA","CIRUGIA"};
            String[] names={"Consulta","Extracción","Limpieza","Cirugía"};
            for(int i=0;i<codes.length;i++) {
                UUID practice=db.id("insert into practica(tenant_id,codigo_local,origen,base_inicial,estado) values (?,?,'BASE',?,'ACTIVA') returning id",tenant,codes[i],codes[i]);
                db.update("insert into version_practica(tenant_id,practica_id,numero_version,nombre,clasificacion,autor_id,creada_en) values (?,?,1,?,'ADMINISTRATIVA',?,now())",tenant,practice,names[i],actor);
            }
            policy(tenant,actor,new PolicyInput(b.holdMinutes(),b.maxActiveBookings(),false,"Configuración inicial: cierre automático deshabilitado"));
            audit.record(tenant,actor,"ENTITY_CREATED","entidad",tenant); return null;
        });
        return Map.of("id",tenant);
    }
    @GetMapping("/entities/{tenant}/members")
    public Object members(Principal p,@PathVariable UUID tenant) {
        return tx.run(tenant,actor(p),() -> { auth.require(actor(p),"members:manage");
            return db.list("select m.id,m.cuenta_id,m.estado,c.nombre,c.email_acceso from membresia m join cuenta c on c.id=m.cuenta_id order by m.id limit 200"); });
    }
    @PostMapping("/entities/{tenant}/members")
    public Object member(Principal p,@PathVariable UUID tenant,@Valid @RequestBody MemberInput b) {
        return tx.run(tenant,actor(p),() -> { auth.require(actor(p),"members:manage");
            UUID id=member(tenant,actor(p),b.accountId());
            for(String perm:b.permissions()) {
                if(!Set.of("members:manage","patients:manage","admissions:manage","catalog:manage","professionals:manage","coverage:manage","policy:manage","audit:read","notifications:manage").contains(perm))
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Permiso no asignable a membresía.");
                grant(tenant,id,actor(p),perm);
            }
            audit.record(tenant,actor(p),"MEMBER_GRANTED","membresia",id); return Map.of("id",id); });
    }
    @DeleteMapping("/entities/{tenant}/members/{id}")
    public void revokeMember(Principal p,@PathVariable UUID tenant,@PathVariable UUID id) {
        tx.run(tenant,actor(p),() -> { auth.require(actor(p),"members:manage");
            var membership=db.one("select id,cuenta_id from membresia where id=? for update",id);
            if(actor(p).equals(Db.uuid(membership,"cuenta_id")))
                throw new ResponseStatusException(HttpStatus.CONFLICT,"Otra persona autorizada debe revisar la baja de su propia membresía.");
            if(db.exists("select 1 from turno t join version_turno v on v.turno_id=t.id and v.tenant_id=t.tenant_id and v.sustituida_en is null join agenda a on a.id=v.agenda_id and a.tenant_id=v.tenant_id join profesional_entidad pe on pe.id=a.profesional_entidad_id and pe.tenant_id=a.tenant_id where pe.membresia_id=? and t.estado_turno='REGISTRADO' and v.inicio_atencion>now()",id))
                throw new ResponseStatusException(HttpStatus.CONFLICT,"Resuelva los turnos futuros del profesional antes de finalizar el vínculo.");
            if(db.exists("select 1 from pre_reserva h join agenda a on a.id=h.agenda_id and a.tenant_id=h.tenant_id join profesional_entidad pe on pe.id=a.profesional_entidad_id and pe.tenant_id=a.tenant_id where pe.membresia_id=? and h.estado='ACTIVA' and h.vence_en>now()",id))
                throw new ResponseStatusException(HttpStatus.CONFLICT,"Hay pre-reservas vigentes. Espere su resolución o vencimiento antes de finalizar el vínculo.");
            db.update("update membresia set estado='REVOCADA',hasta=now() where id=?",id);
            db.update("update membresia_permiso set revocada_en=now() where membresia_id=? and revocada_en is null",id);
            db.update("update profesional_entidad set estado='INACTIVO',hasta=now() where membresia_id=?",id);
            db.update("update delegacion_agenda set revocada_en=now() where membresia_id=? and revocada_en is null",id);
            db.update("update delegacion_agenda set revocada_en=now() where agenda_id in (select a.id from agenda a join profesional_entidad pe on pe.id=a.profesional_entidad_id and pe.tenant_id=a.tenant_id where pe.membresia_id=?) and revocada_en is null",id);
            db.update("insert into aviso_cuenta_staff(cuenta_id,tenant_id,tipo) values (?,?,'VINCULO_FINALIZADO')",membership.get("cuenta_id"),tenant);
            audit.record(tenant,actor(p),"MEMBER_REVOKED","membresia",id); return null; });
    }
    @PutMapping("/entities/{tenant}/members/{id}/permissions")
    public void permissions(Principal p,@PathVariable UUID tenant,@PathVariable UUID id,@Valid @RequestBody PermissionsInput b) {
        tx.run(tenant,actor(p),() -> {
            auth.require(actor(p),"members:manage");
            var membership=db.one("select cuenta_id from membresia where id=? and estado='ACTIVA' for update",id);
            if(actor(p).equals(Db.uuid(membership,"cuenta_id")) && !b.permissions().contains("members:manage"))
                throw new ResponseStatusException(HttpStatus.CONFLICT,"No puede retirar su propia facultad de administrar el equipo.");
            var allowed=Set.of("members:manage","patients:manage","admissions:manage","catalog:manage","professionals:manage","coverage:manage","policy:manage","audit:read","notifications:manage");
            if(!allowed.containsAll(b.permissions()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Permiso no asignable a membresía.");
            db.update("update membresia_permiso set revocada_en=now() where membresia_id=? and revocada_en is null",id);
            for(String permission:b.permissions())grant(tenant,id,actor(p),permission);
            audit.record(tenant,actor(p),"MEMBER_PERMISSIONS_CHANGED","membresia",id);return null;
        });
    }
    @PostMapping("/entities/{tenant}/professionals")
    public Object professional(Principal p,@PathVariable UUID tenant,@Valid @RequestBody ProfessionalInput b) {
        return tx.run(tenant,actor(p),() -> { auth.require(actor(p),"professionals:manage");
            if(db.exists("select 1 from profesional_global where cuenta_id=?",b.accountId()))
                throw new ResponseStatusException(HttpStatus.CONFLICT,"El profesional ya tiene cuenta. Debe solicitar el vínculo desde su perfil y la institución debe aprobarlo.");
            UUID member=member(tenant,actor(p),b.accountId());
            // Solo una identidad global por cuenta, nunca por coincidencia de nombre o matrícula.
            UUID global=db.id("insert into profesional_global(cuenta_id,nombre_referencia,matricula_referencia,estado) values (?,?,?,'ACTIVO') on conflict(cuenta_id) do update set cuenta_id=excluded.cuenta_id returning id",b.accountId(),b.name(),b.registration());
            UUID id=db.id("insert into profesional_entidad(tenant_id,profesional_id,membresia_id,desde,estado) values (?,?,?,now(),'ACTIVO') on conflict(tenant_id,profesional_id) do update set membresia_id=excluded.membresia_id,estado='ACTIVO',hasta=null returning id",tenant,global,member);
            audit.record(tenant,actor(p),"PROFESSIONAL_LINKED","profesional_entidad",id); return Map.of("id",id); });
    }
    @GetMapping("/entities/{tenant}/professionals")
    public Object professionals(Principal p,@PathVariable UUID tenant) {
        return tx.run(tenant,actor(p),() -> db.list("select id,estado from profesional_entidad where estado='ACTIVO' order by id limit 200"));
    }
    @PostMapping("/entities/{tenant}/branches")
    public Object branch(Principal p,@PathVariable UUID tenant,@Valid @RequestBody BranchInput b) {
        return tx.run(tenant,actor(p),() -> { auth.require(actor(p),"professionals:manage"); ZoneId.of(b.timezone());
            UUID id=db.id("insert into sede(tenant_id,nombre,direccion,zona_horaria,estado) values (?,?,?,?,'ACTIVA') returning id",tenant,b.name(),b.address(),b.timezone());
            audit.record(tenant,actor(p),"BRANCH_CREATED","sede",id); return Map.of("id",id); });
    }
    @PostMapping("/entities/{tenant}/agendas")
    public Object agenda(Principal p,@PathVariable UUID tenant,@Valid @RequestBody AgendaInput b) {
        return tx.run(tenant,actor(p),() -> { auth.require(actor(p),"professionals:manage"); ZoneId.of(b.timezone());
            db.one("select pe.id from profesional_entidad pe join membresia m on m.id=pe.membresia_id and m.tenant_id=pe.tenant_id where pe.id=? and pe.estado='ACTIVO' and m.estado='ACTIVA' and m.desde<=now() and (m.hasta is null or m.hasta>now())",b.professionalEntityId());
            db.one("select id from sede where id=? and estado='ACTIVA'",b.branchId());
            UUID id=db.id("insert into agenda(tenant_id,profesional_entidad_id,sede_id,nombre,zona_horaria,estado) values (?,?,?,?,?,'ACTIVA') returning id",tenant,b.professionalEntityId(),b.branchId(),b.name(),b.timezone());
            audit.record(tenant,actor(p),"AGENDA_CREATED","agenda",id); return Map.of("id",id); });
    }
    @PostMapping("/entities/{tenant}/agendas/{agenda}/hours")
    public Object hours(Principal p,@PathVariable UUID tenant,@PathVariable UUID agenda,@Valid @RequestBody HoursInput b) {
        return tx.run(tenant,actor(p),() -> { auth.requireAgenda(actor(p),agenda,"agenda:configure");
            if(!b.end().isAfter(b.start())||b.until()!=null&&b.until().isBefore(b.from()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Horario o vigencia inválida.");
            UUID id=db.id("insert into horario_agenda(tenant_id,agenda_id,dia_semana,hora_inicio,hora_fin,desde,hasta) values (?,?,?,?,?,?,?) returning id",tenant,agenda,b.day(),b.start(),b.end(),b.from(),b.until());
            audit.record(tenant,actor(p),"HOURS_CREATED","horario_agenda",id); return Map.of("id",id); });
    }
    @PostMapping("/entities/{tenant}/agendas/{agenda}/delegations")
    public Object delegate(Principal p,@PathVariable UUID tenant,@PathVariable UUID agenda,@Valid @RequestBody DelegationInput b) {
        return tx.run(tenant,actor(p),() -> {
            var owner=db.one("select a.profesional_entidad_id from agenda a join profesional_entidad pe on pe.id=a.profesional_entidad_id and pe.tenant_id=a.tenant_id join profesional_global pg on pg.id=pe.profesional_id where a.id=? and pg.cuenta_id=? and pe.estado='ACTIVO'",agenda,actor(p));
            auth.requireAgenda(actor(p),agenda,"agenda:configure");
            UUID id=db.id("insert into delegacion_agenda(tenant_id,agenda_id,membresia_id,otorgante_profesional_id,desde) values (?,?,?,?,now()) returning id",tenant,agenda,b.membershipId(),owner.get("profesional_entidad_id"));
            for(String perm:b.permissions()) {
                if(!Set.of("agenda:read","agenda:configure","booking:create","booking:read","booking:confirm","booking:cancel","booking:reschedule").contains(perm))
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Acción no delegable por agenda.");
                db.update("insert into delegacion_permiso(tenant_id,delegacion_id,permiso_id) select ?,?,id from permiso where codigo=?",tenant,id,perm);
            }
            audit.record(tenant,actor(p),"AGENDA_DELEGATED","delegacion_agenda",id); return Map.of("id",id); });
    }
    @DeleteMapping("/entities/{tenant}/agendas/{agenda}/delegations/{id}")
    public void revokeDelegation(Principal p,@PathVariable UUID tenant,@PathVariable UUID agenda,@PathVariable UUID id) {
        tx.run(tenant,actor(p),() -> { auth.requireAgenda(actor(p),agenda,"agenda:configure");
            // Revocación reservada al titular, incluso si se delegó configuración horaria.
            db.one("select a.id from agenda a join profesional_entidad pe on pe.id=a.profesional_entidad_id and pe.tenant_id=a.tenant_id join profesional_global pg on pg.id=pe.profesional_id where a.id=? and pg.cuenta_id=?",agenda,actor(p));
            db.update("update delegacion_agenda set revocada_en=now() where id=? and agenda_id=?",id,agenda);
            audit.record(tenant,actor(p),"DELEGATION_REVOKED","delegacion_agenda",id); return null; });
    }
    @GetMapping("/entities/{tenant}/practices")
    public Object practices(Principal p,@PathVariable UUID tenant) {
        return tx.run(tenant,actor(p),() -> db.list("select p.*,v.nombre from practica p join version_practica v on v.practica_id=p.id and v.tenant_id=p.tenant_id where v.numero_version=(select max(numero_version) from version_practica where practica_id=p.id) order by p.codigo_local limit 200"));
    }
    @PostMapping("/entities/{tenant}/practices")
    public Object practice(Principal p,@PathVariable UUID tenant,@Valid @RequestBody PracticeInput b) {
        return tx.run(tenant,actor(p),() -> { auth.require(actor(p),"catalog:manage");
            UUID id=db.id("insert into practica(tenant_id,codigo_local,origen,estado) values (?,?,'PERSONALIZADA','ACTIVA') returning id",tenant,b.code());
            db.update("insert into version_practica(tenant_id,practica_id,numero_version,nombre,clasificacion,autor_id,creada_en) values (?,?,1,?,'PERSONALIZADA',?,now())",tenant,id,b.name(),actor(p));
            audit.record(tenant,actor(p),"PRACTICE_CREATED","practica",id); return Map.of("id",id); });
    }
    @PostMapping("/entities/{tenant}/agendas/{agenda}/offers")
    public Object offer(Principal p,@PathVariable UUID tenant,@PathVariable UUID agenda,@Valid @RequestBody OfferInput b) {
        return tx.run(tenant,actor(p),() -> { auth.requireAgenda(actor(p),agenda,"agenda:configure");
            var practice=db.one("select p.*,v.id version_id from practica p join version_practica v on v.practica_id=p.id and v.tenant_id=p.tenant_id where p.id=? and p.estado='ACTIVA' order by v.numero_version desc limit 1",b.practiceId());
            boolean consultation="CONSULTA".equals(practice.get("base_inicial")) && "BASE".equals(practice.get("origen"));
            if(b.portalEnabled() && !consultation) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Solo la Consulta base permite elección en portal.");
            UUID id=db.id("insert into oferta(tenant_id,agenda_id,practica_id,estado) values (?,?,?,'ACTIVA') on conflict(tenant_id,agenda_id,practica_id) do update set estado='ACTIVA' returning id",tenant,agenda,b.practiceId());
            db.update("update version_oferta set hasta=now() where oferta_id=? and hasta is null",id);
            UUID version=db.id("insert into version_oferta(tenant_id,oferta_id,version_practica_id,numero_version,duracion_min,preparacion_min,cierre_min,modalidad,portal_habilitado,gestion_personal,particular_habilitado,desde) select ?,?,?,coalesce(max(numero_version),0)+1,?,?,?,'PRESENCIAL',?,?,?,now() from version_oferta where oferta_id=? returning id",tenant,id,practice.get("version_id"),b.durationMinutes(),b.preparationMinutes(),b.closingMinutes(),b.portalEnabled(),!consultation,b.privatePaymentEnabled(),id);
            audit.record(tenant,actor(p),"OFFER_VERSION_CREATED","version_oferta",version); return Map.of("id",version); });
    }
    @PutMapping("/entities/{tenant}/policy")
    public void setPolicy(Principal p,@PathVariable UUID tenant,@Valid @RequestBody PolicyInput b) {
        tx.run(tenant,actor(p),() -> { auth.require(actor(p),"policy:manage"); policy(tenant,actor(p),b);
            audit.record(tenant,actor(p),"POLICY_CHANGED","entidad",tenant); return null; });
    }
    @GetMapping("/entities/{tenant}/policy")
    public Object getPolicy(Principal p,@PathVariable UUID tenant) {
        return tx.run(tenant,actor(p),() -> {auth.require(actor(p),"policy:manage");
            return db.one("select id,numero_version,(parametros->>'holdMinutes')::int hold_minutes,(parametros->>'maxActive')::int max_active,(parametros->>'automaticClose')::boolean automatic_close,parametros->>'approval' approval from politica_operativa where tipo='RESERVAS' and hasta is null order by numero_version desc limit 1");});
    }
    @GetMapping("/entities/{tenant}/audit")
    public Object audit(Principal p,@PathVariable UUID tenant,@RequestParam(defaultValue="0") @Min(0) int offset) {
        return tx.run(tenant,actor(p),() -> { auth.require(actor(p),"audit:read");
            return db.list("select id,actor_id,servicio_actor,accion,recurso_tipo,recurso_ref,ocurrido_en,resultado from auditoria_entidad order by id desc limit 100 offset ?",offset); });
    }
    private UUID member(UUID tenant,UUID actor,UUID account) {
        return db.id("insert into membresia(tenant_id,cuenta_id,desde,estado) values (?,?,now(),'ACTIVA') on conflict(tenant_id,cuenta_id) do update set estado='ACTIVA',hasta=null returning id",tenant,account);
    }
    private void grant(UUID tenant,UUID member,UUID actor,String perm) {
        db.update("insert into membresia_permiso(tenant_id,membresia_id,permiso_id,otorgante_id,desde) select ?,?,id,?,now() from permiso where codigo=?",tenant,member,actor,perm);
    }
    private void policy(UUID tenant,UUID actor,PolicyInput b) {
        db.update("update politica_operativa set hasta=now() where tipo='RESERVAS' and hasta is null");
        db.update("insert into politica_operativa(tenant_id,tipo,numero_version,parametros,desde,aprobador_id) select ?,'RESERVAS',coalesce(max(numero_version),0)+1,jsonb_build_object('holdMinutes',?::int,'maxActive',?::int,'automaticClose',?::boolean,'approval',?::text),now(),? from politica_operativa where tipo='RESERVAS'",tenant,b.holdMinutes(),b.maxActiveBookings(),b.automaticCloseEnabled(),b.approvalReference(),actor);
    }
}
