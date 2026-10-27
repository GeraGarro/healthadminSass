package ar.com.salud.config;

import ar.com.salud.shared.Db;
import java.util.*;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.core.env.Environment;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;

/** Provisionamiento explícito; ausente en el proceso normal de producción. */
@Component @Profile({"local","bootstrap"})
public class BootstrapRunner implements ApplicationRunner {
    private final Flyway flyway; private final PasswordEncoder passwords; private final String email;private final String password;private final boolean demo;
    private final Environment environment;
    public BootstrapRunner(Flyway flyway,PasswordEncoder passwords,@Value("${BOOTSTRAP_EMAIL:}") String email,
        @Value("${BOOTSTRAP_PASSWORD:}") String password,@Value("${DEMO_ENABLED:false}") boolean demo,Environment environment) {
        this.flyway=flyway;this.passwords=passwords;this.email=email;this.password=password;this.demo=demo;
        this.environment=environment;
    }
    @Override public void run(ApplicationArguments args) {
        if(demo && !Arrays.asList(environment.getActiveProfiles()).contains("local"))throw new IllegalArgumentException("Los datos demo requieren el perfil local");
        if(email.isBlank()) return;
        if(password.length()<12 || password.length()>72) throw new IllegalArgumentException("Contraseña de bootstrap: 12 a 72 caracteres");
        var source=flyway.getConfiguration().getDataSource();var db=new Db(new JdbcTemplate(source));
        new TransactionTemplate(new DataSourceTransactionManager(source)).executeWithoutResult(s -> {
            UUID root=account(db,"Administrador de pruebas",email,password);
            db.update("insert into facultad_plataforma(cuenta_id,permiso_id,otorgante_id,desde) select ?,id,?,now() from permiso p where codigo='entities:manage' and not exists(select 1 from facultad_plataforma f where f.cuenta_id=? and f.permiso_id=p.id and f.revocada_en is null)",root,root,root);
            if(!demo) return;
            UUID professional=account(db,"Profesional ficticio","profesional@demo.test",password);
            UUID patientAccount=account(db,"Paciente ficticio","paciente@demo.test",password);
            UUID secretary=account(db,"Secretaría ficticia","secretaria@demo.test",password);
            if(db.exists("select 1 from entidad where nombre='Clínica de prueba local'")) return;
            UUID tenant=db.id("insert into entidad(tipo,nombre,zona_horaria,estado,creada_en) values ('CLINICA','Clínica de prueba local','America/Argentina/Buenos_Aires','ACTIVA',now()) returning id");
            UUID adminMember=member(db,tenant,root);UUID profMember=member(db,tenant,professional);UUID secretaryMember=member(db,tenant,secretary);
            db.update("insert into membresia_permiso(tenant_id,membresia_id,permiso_id,otorgante_id,desde) select ?,?,id,?,now() from permiso where codigo in ('members:manage','patients:manage','admissions:manage','catalog:manage','professionals:manage','coverage:manage','policy:manage','audit:read','notifications:manage')",tenant,adminMember,root);
            UUID global=db.id("insert into profesional_global(cuenta_id,nombre_referencia,matricula_referencia,estado) values (?,'Profesional ficticio','DEMO-001','ACTIVO') returning id",professional);
            UUID pe=db.id("insert into profesional_entidad(tenant_id,profesional_id,membresia_id,desde,estado) values (?,?,?,now(),'ACTIVO') returning id",tenant,global,profMember);
            UUID branch=db.id("insert into sede(tenant_id,nombre,zona_horaria,estado) values (?,'Sede de prueba','America/Argentina/Buenos_Aires','ACTIVA') returning id",tenant);
            UUID agenda=db.id("insert into agenda(tenant_id,profesional_entidad_id,sede_id,nombre,zona_horaria,estado) values (?,?,?,'Agenda de prueba','America/Argentina/Buenos_Aires','ACTIVA') returning id",tenant,pe,branch);
            for(int day=1;day<=7;day++) db.update("insert into horario_agenda(tenant_id,agenda_id,dia_semana,hora_inicio,hora_fin,desde) values (?,?,?,'08:00','20:00',current_date)",tenant,agenda,day);
            UUID delegation=db.id("insert into delegacion_agenda(tenant_id,agenda_id,membresia_id,otorgante_profesional_id,desde) values (?,?,?,?,now()) returning id",tenant,agenda,secretaryMember,pe);
            db.update("insert into delegacion_permiso(tenant_id,delegacion_id,permiso_id) select ?,?,id from permiso where codigo in ('agenda:read','booking:create','booking:read','booking:confirm','booking:cancel','booking:reschedule')",tenant,delegation);
            for(String code:List.of("CONSULTA","EXTRACCION","LIMPIEZA","CIRUGIA")) {
                UUID practice=db.id("insert into practica(tenant_id,codigo_local,origen,base_inicial,estado) values (?,?,'BASE',?,'ACTIVA') returning id",tenant,code,code);
                UUID version=db.id("insert into version_practica(tenant_id,practica_id,numero_version,nombre,clasificacion,autor_id,creada_en) values (?,?,1,?,'ADMINISTRATIVA',?,now()) returning id",tenant,practice,code,root);
                UUID offer=db.id("insert into oferta(tenant_id,agenda_id,practica_id,estado) values (?,?,?,'ACTIVA') returning id",tenant,agenda,practice);
                db.update("insert into version_oferta(tenant_id,oferta_id,version_practica_id,numero_version,duracion_min,preparacion_min,cierre_min,modalidad,portal_habilitado,gestion_personal,particular_habilitado,desde) values (?,?,?,1,30,0,0,'PRESENCIAL',?,?,true,now())",tenant,offer,version,"CONSULTA".equals(code),!"CONSULTA".equals(code));
            }
            UUID patient=db.id("insert into paciente(tenant_id,nombres,apellidos,estado,estado_datos_cobertura) values (?,'Paciente','Ficticio','ACTIVO','SIN_COBERTURA') returning id",tenant);
            db.update("insert into contador_paciente(tenant_id,profesional_id,profesional_entidad_id,ultimo_confirmado,version) values (?,?,?,1,1)",tenant,global,pe);
            db.update("insert into paciente_profesional(tenant_id,profesional_id,profesional_entidad_id,paciente_id,numero_visible,estado,alta_en) values (?,?,?,?,1,'ACTIVO',now())",tenant,global,pe,patient);
            UUID access=db.id("insert into acceso_paciente(tenant_id,paciente_id,cuenta_id,aprobador_id,aprobado_en,activado_en,estado,vinculacion_ref) values (?,?,?,?,now(),now(),'ACTIVO','DEMO') returning id",tenant,patient,patientAccount,root);
            db.update("insert into alcance_acceso(tenant_id,acceso_id,profesional_entidad_id,agenda_id,permiso_id,desde) select ?,?,?,?,id,now() from permiso where codigo in ('patient:read','booking:create','booking:read','booking:confirm','booking:cancel','booking:reschedule','chat:read','chat:write')",tenant,access,pe,agenda);
            db.update("insert into politica_operativa(tenant_id,tipo,numero_version,parametros,desde,aprobador_id) values (?,'RESERVAS',1,'{\"holdMinutes\":5,\"maxActive\":3,\"automaticClose\":false,\"approval\":\"Solo prueba local\"}',now(),?)",tenant,root);
            for(String type:List.of("EMAIL","WHATSAPP")) {
                db.update("insert into canal_entidad(tenant_id,canal,proveedor,cuenta_externa,remitente,secreto_ref,verificada_en,estado) values (?,?,'SIMULADO','demo','demo','NO_SECRET',now(),'ACTIVO')",tenant,type);
                UUID contact=db.id("insert into contacto_paciente(tenant_id,paciente_id,tipo,valor,verificado_en,estado) values (?,?,?,?,now(),'ACTIVO') returning id",tenant,patient,type,type.equals("EMAIL")?"paciente@demo.test":"+540000000000");
                db.update("insert into destino_aviso(tenant_id,paciente_id,contacto_id,canal,proposito,autorizacion_ref,desde) values (?,?,?,?,'TURNOS','DEMO',now())",tenant,patient,contact,type);
            }
        });
    }
    private UUID account(Db db,String name,String email,String password) {
        var existing=db.list("select id from cuenta where lower(email_acceso)=lower(?)",email);
        if(!existing.isEmpty()) return Db.uuid(existing.getFirst(),"id");
        UUID id=db.id("insert into cuenta(nombre,email_acceso,email_verificado_en,estado,creada_en) values (?,lower(?),now(),'ACTIVA',now()) returning id",name,email);
        db.update("insert into credencial_local(cuenta_id,hash_contrasena,algoritmo_version,actualizada_en) values (?,?,'bcrypt',now())",id,passwords.encode(password));return id;
    }
    private UUID member(Db db,UUID tenant,UUID account) {return db.id("insert into membresia(tenant_id,cuenta_id,desde,estado) values (?,?,now(),'ACTIVA') returning id",tenant,account);}
}
