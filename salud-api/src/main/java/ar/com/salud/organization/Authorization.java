package ar.com.salud.organization;

import ar.com.salud.shared.Db;
import java.util.UUID;
import java.util.Set;
import org.springframework.stereotype.Component;
import org.springframework.security.access.AccessDeniedException;

@Component
public class Authorization {
    private final Db db;
    public Authorization(Db db) { this.db=db; }
    public boolean staff(UUID actor,String permission) {
        if(Set.of("members:manage","professionals:manage","patients:manage","admissions:manage","catalog:manage","coverage:manage","policy:manage","audit:read","notifications:manage").contains(permission)&&independentOwner(actor))return true;
        if(Set.of("patients:manage","admissions:manage","notifications:manage").contains(permission) && institutionAdmin(actor)) return false;
        return db.exists("""
            select 1 from membresia m join membresia_permiso mp on mp.membresia_id=m.id and mp.tenant_id=m.tenant_id
            join permiso p on p.id=mp.permiso_id where m.cuenta_id=? and m.estado='ACTIVA'
            and m.desde<=now() and (m.hasta is null or m.hasta>now()) and mp.desde<=now()
            and (mp.hasta is null or mp.hasta>now()) and mp.revocada_en is null and p.codigo=?
            """,actor,permission);
    }
    public void require(UUID actor,String permission) { if(!staff(actor,permission)) deny(); }
    public boolean agenda(UUID actor,UUID agenda,String permission) {
        if(institutionAdmin(actor)) return false;
        // Un cargo administrativo no concede acceso a la agenda.
        return db.exists("""
            select 1 from agenda a join profesional_entidad pe on pe.id=a.profesional_entidad_id and pe.tenant_id=a.tenant_id
            join profesional_global pg on pg.id=pe.profesional_id
            join membresia m on m.id=pe.membresia_id and m.tenant_id=pe.tenant_id
            where a.id=? and pg.cuenta_id=? and pe.estado='ACTIVO' and m.estado='ACTIVA'
            and m.desde<=now() and (m.hasta is null or m.hasta>now())
            """,agenda,actor) || db.exists("""
            select 1 from delegacion_agenda d join membresia m on m.id=d.membresia_id and m.tenant_id=d.tenant_id
            join delegacion_permiso dp on dp.delegacion_id=d.id and dp.tenant_id=d.tenant_id
            join permiso p on p.id=dp.permiso_id where d.agenda_id=? and m.cuenta_id=?
            and m.estado='ACTIVA' and m.desde<=now() and (m.hasta is null or m.hasta>now())
            and d.desde<=now() and (d.hasta is null or d.hasta>now()) and d.revocada_en is null and p.codigo=?
            """,agenda,actor,permission);
    }
    public void requireAgenda(UUID actor,UUID agenda,String permission) {
        if(!agenda(actor,agenda,permission)) deny();
    }
    public boolean patient(UUID actor,UUID patient,UUID agenda,String permission) {
        if(institutionAdmin(actor)) return false;
        return db.exists("""
            select 1 from acceso_paciente a join alcance_acceso s on s.acceso_id=a.id and s.tenant_id=a.tenant_id
            join permiso p on p.id=s.permiso_id
            join profesional_entidad pe on pe.id=s.profesional_entidad_id and pe.tenant_id=s.tenant_id
            where a.cuenta_id=? and a.paciente_id=? and a.estado='ACTIVO' and a.activado_en is not null
            and pe.estado='ACTIVO' and s.desde<=now() and (s.hasta is null or s.hasta>now()) and s.revocado_en is null
            and p.codigo=? and (?::uuid is null or s.agenda_id is null or s.agenda_id=?)
            and (?::uuid is null or exists(select 1 from agenda ag where ag.id=? and ag.profesional_entidad_id=s.profesional_entidad_id))
            and (a.representacion_id is null or exists(select 1 from representacion r
              join representacion_permiso rp on rp.representacion_id=r.id and rp.tenant_id=r.tenant_id
              where r.id=a.representacion_id and r.representante_id=a.cuenta_id and r.paciente_id=a.paciente_id
              and r.revocada_en is null and r.desde<=now() and (r.hasta is null or r.hasta>now()) and rp.permiso_id=p.id))
            """,actor,patient,permission,agenda,agenda,agenda,agenda);
    }
    public void booking(UUID actor,UUID patient,UUID agenda,String permission) {
        if(!agenda(actor,agenda,permission) && !patient(actor,patient,agenda,permission)) deny();
    }
    public void platform(UUID actor) {
        if(!db.exists("select 1 from facultad_plataforma f join permiso p on p.id=f.permiso_id where cuenta_id=? and p.codigo='entities:manage' and desde<=now() and (hasta is null or hasta>now()) and revocada_en is null",actor)) deny();
    }
    private static void deny() { throw new AccessDeniedException("Facultad no concedida"); }
    public boolean institutionAdmin(UUID actor) {
        return !independentOwner(actor)&&db.exists("select 1 from membresia m join membresia_permiso mp on mp.membresia_id=m.id and mp.tenant_id=m.tenant_id join permiso p on p.id=mp.permiso_id where m.cuenta_id=? and m.estado='ACTIVA' and m.desde<=now() and (m.hasta is null or m.hasta>now()) and mp.revocada_en is null and mp.desde<=now() and (mp.hasta is null or mp.hasta>now()) and p.codigo in ('members:manage','professionals:manage','policy:manage')",actor);
    }
    /** Management applies only to an active owner inside the explicitly selected tenant transaction. */
    public boolean independentOwner(UUID actor){return db.exists("select 1 from profesional_entidad pe join profesional_global pg on pg.id=pe.profesional_id join entidad e on e.id=pe.tenant_id join membresia m on m.id=pe.membresia_id and m.tenant_id=pe.tenant_id where pe.tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid and e.tipo='INDEPENDIENTE' and pg.cuenta_id=? and pe.estado='ACTIVO' and pe.desde<=now() and (pe.hasta is null or pe.hasta>now()) and m.estado='ACTIVA' and m.desde<=now() and (m.hasta is null or m.hasta>now())",actor);}
    public void requireCare(UUID actor) { if(institutionAdmin(actor))deny(); }
}
