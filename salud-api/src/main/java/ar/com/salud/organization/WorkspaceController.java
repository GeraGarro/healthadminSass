package ar.com.salud.organization;

import ar.com.salud.audit.Audit;
import ar.com.salud.shared.*;
import java.security.Principal;
import java.util.*;
import org.springframework.web.bind.annotation.*;

/** Read projection for the web client. Grants are evaluated by the same authorizer as commands. */
@RestController
@RequestMapping("/api/v1/entities/{tenant}/workspace")
public class WorkspaceController {
    private final Db db; private final TenantTransactions tx; private final Authorization auth; private final Audit audit;
    private static final List<String> STAFF = List.of("members:manage","patients:manage","admissions:manage","catalog:manage","professionals:manage","coverage:manage","policy:manage","audit:read","notifications:manage");
    private static final List<String> AGENDA = List.of("agenda:read","agenda:configure","booking:read","booking:create","booking:confirm","booking:cancel","booking:reschedule");
    public WorkspaceController(Db db,TenantTransactions tx,Authorization auth,Audit audit) { this.db=db;this.tx=tx;this.auth=auth;this.audit=audit; }
    @GetMapping
    public Object workspace(Principal p,@PathVariable UUID tenant) {
        UUID actor=UUID.fromString(p.getName());
        return tx.run(tenant,actor,() -> {
            var agendas=new ArrayList<Map<String,Object>>();
            for(var a:db.list("""
                select a.id,a.nombre,a.zona_horaria,a.profesional_entidad_id,
                    pg.nombre_referencia profesional,s.nombre sede,pg.cuenta_id=? titular
                from agenda a join profesional_entidad pe on pe.id=a.profesional_entidad_id and pe.tenant_id=a.tenant_id
                join profesional_global pg on pg.id=pe.profesional_id
                left join sede s on s.id=a.sede_id and s.tenant_id=a.tenant_id
                where a.estado='ACTIVA' order by a.nombre
                """,actor)) {
                UUID id=Db.uuid(a,"id");
                if(!auth.agenda(actor,id,"agenda:read")) continue;
                a.put("permissions",AGENDA.stream().filter(perm->auth.agenda(actor,id,perm)).toList());
                agendas.add(a);
            }
            var permissions=STAFF.stream().filter(perm->auth.staff(actor,perm)).toList();
            // Patient/admission management can select an active professional without reading their agenda.
            var professionals=permissions.contains("patients:manage") || permissions.contains("admissions:manage")
                ? db.list("""
                    select pe.id,pg.nombre_referencia nombre from profesional_entidad pe
                    join profesional_global pg on pg.id=pe.profesional_id
                    join membresia m on m.id=pe.membresia_id and m.tenant_id=pe.tenant_id
                    where pe.estado='ACTIVO' and pe.desde<=now() and (pe.hasta is null or pe.hasta>now())
                    and m.estado='ACTIVA' and m.desde<=now() and (m.hasta is null or m.hasta>now())
                    order by pg.nombre_referencia,pe.id
                    """) : List.of();
            // Membership names are visible only to membership managers or an agenda owner who can delegate.
            boolean owns=agendas.stream().anyMatch(a->Boolean.TRUE.equals(a.get("titular")));
            var members=owns||permissions.contains("members:manage")?db.list("""
                select m.id,c.nombre from membresia m join cuenta c on c.id=m.cuenta_id
                where m.estado='ACTIVA' and m.desde<=now() and (m.hasta is null or m.hasta>now()) order by c.nombre
                """):List.of();
            var delegations=new ArrayList<Map<String,Object>>();
            for(var a:agendas) if(Boolean.TRUE.equals(a.get("titular"))) {
                for(var d:db.list("""
                    select d.id,d.agenda_id,d.membresia_id,c.nombre from delegacion_agenda d
                    join membresia m on m.id=d.membresia_id and m.tenant_id=d.tenant_id
                    join cuenta c on c.id=m.cuenta_id where d.agenda_id=? and d.revocada_en is null
                    and d.desde<=now() and (d.hasta is null or d.hasta>now()) order by d.id
                    """,a.get("id"))) {
                    d.put("permissions",db.list("select p.codigo from delegacion_permiso dp join permiso p on p.id=dp.permiso_id where dp.delegacion_id=?",d.get("id")).stream().map(r->r.get("codigo")).toList());
                    delegations.add(d);
                }
            }
            audit.record(tenant,actor,"WORKSPACE_READ","entidad",tenant);
            boolean professional=db.exists("select 1 from profesional_entidad pe join profesional_global pg on pg.id=pe.profesional_id join membresia m on m.id=pe.membresia_id and m.tenant_id=pe.tenant_id where pg.cuenta_id=? and pe.estado='ACTIVO' and m.estado='ACTIVA' and m.desde<=now() and (m.hasta is null or m.hasta>now())",actor);
            return Map.of("timezone",db.one("select zona_horaria from entidad where id=?",tenant).get("zona_horaria"),"permissions",permissions,"agendas",agendas,"members",members,"delegations",delegations,"professionals",professionals,"professional",professional,"independentOwner",auth.independentOwner(actor));
        });
    }
    @GetMapping("/patients/{id}")
    public Object patientReferences(Principal p,@PathVariable UUID tenant,@PathVariable UUID id) {
        UUID actor=UUID.fromString(p.getName());
        return tx.run(tenant,actor,() -> {
            if(!auth.staff(actor,"patients:manage") && !auth.patient(actor,id,null,"patient:read"))
                throw new org.springframework.security.access.AccessDeniedException("Sin facultad de ficha");
            db.one("select id from paciente where id=?",id);
            audit.record(tenant,actor,"PATIENT_REFERENCES_READ","paciente",id);
            return Map.of("contacts",db.list("select id,tipo,valor,verificado_en,estado from contacto_paciente where paciente_id=? order by id",id),
                "affiliations",db.list("select a.id,c.nombre,a.numero_afiliado,a.estado_verificacion,a.desde,a.hasta from afiliacion_paciente a join cobertura_medica c on c.id=a.cobertura_id and c.tenant_id=a.tenant_id where a.paciente_id=? order by a.id",id),
                "representations",auth.staff(actor,"admissions:manage")?db.list("select id,representante_id,evidencia_ref,desde,hasta,revocada_en from representacion where paciente_id=? order by id",id):List.of(),
                "access",auth.staff(actor,"admissions:manage")?db.list("select id,cuenta_id,estado,aprobado_en,activado_en from acceso_paciente where paciente_id=? order by id",id):List.of(),
                "authorizations",db.list("select ac.id,ac.afiliacion_id,ac.practica_id,ac.referencia,ac.estado,ac.desde,ac.hasta from autorizacion_cobertura ac join afiliacion_paciente af on af.id=ac.afiliacion_id and af.tenant_id=ac.tenant_id where af.paciente_id=? order by ac.id",id));
        });
    }
    @GetMapping("/coverage-configuration")
    public Object coverageConfiguration(Principal p,@PathVariable UUID tenant) {
        UUID actor=UUID.fromString(p.getName());
        return tx.run(tenant,actor,() -> {
            auth.require(actor,"coverage:manage");
            return Map.of("plans",db.list("select id,cobertura_id,nombre,estado from plan_cobertura order by nombre limit 300"),
                "agreements",db.list("select c.id,c.cobertura_id,c.oferta_id,c.plan_id,v.desde,v.hasta,v.requiere_autorizacion from convenio c join version_convenio v on v.convenio_id=c.id and v.tenant_id=c.tenant_id where c.estado='ACTIVO' and v.numero_version=(select max(x.numero_version) from version_convenio x where x.convenio_id=c.id) order by c.id desc limit 300"));
        });
    }
}
