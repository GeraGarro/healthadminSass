package ar.com.salud;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.mock.web.MockHttpSession;
import org.junit.jupiter.api.BeforeEach;
import ar.com.salud.shared.*;
import ar.com.salud.organization.*;
import ar.com.salud.scheduling.*;
import ar.com.salud.identity.*;
import ar.com.salud.communication.*;
import ar.com.salud.reporting.ReportController;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.security.Principal;
import tools.jackson.databind.ObjectMapper;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.MountableFile;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Testcontainers
@SpringBootTest(useMainMethod = SpringBootTest.UseMainMethod.ALWAYS, properties={
    "app.encryption-key=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=", "app.delivery.simulated=true", "app.worker.enabled=false",
    "BOOTSTRAP_EMAIL=admin@demo.test","BOOTSTRAP_PASSWORD=integration-test-only-password","DEMO_ENABLED=true",
    "WEBHOOK_SECRET=integration-only-callback-secret-123456789"})
@AutoConfigureMockMvc
@ActiveProfiles("local")
class PostgresIntegrationIT {
    @Container static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:18.6")
            .withDatabaseName("salud").withUsername("postgres").withPassword("test-admin-only")
            .withEnv("APP_DB_PASSWORD", "test-runtime-only")
            .withEnv("MIGRATION_DB_PASSWORD", "test-migration-only")
            .withCopyFileToContainer(MountableFile.forHostPath("docker/postgres/001-roles.sql"),
                    "/docker-entrypoint-initdb.d/001-roles.sql");

    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", () -> "salud_app");
        registry.add("spring.datasource.password", () -> "test-runtime-only");
        registry.add("spring.flyway.url", POSTGRES::getJdbcUrl);
        registry.add("spring.flyway.user", () -> "salud_migrator");
        registry.add("spring.flyway.password", () -> "test-migration-only");
    }

    @Autowired Flyway flyway;
    @Autowired JdbcTemplate jdbc;
    @Autowired MockMvc mvc;
    @Autowired Db db;
    @Autowired TenantTransactions tenants;
    @Autowired Authorization authorization;
    @Autowired BookingService booking;
    @Autowired BookingController bookingController;
    @Autowired IdentityService identity;
    @Autowired SecretBox secrets;
    @Autowired NotificationWorker worker;
    @Autowired CommunicationController communication;
    @Autowired OrganizationController organization;
    @Autowired StaffExperienceController staffExperience;
    @Autowired ar.com.salud.patient.BookingPatientController bookingPatients;
    @Autowired ProfessionalWorkspaceController professionalWorkspace;
    @Autowired WorkspaceController workspace;
    @Autowired ar.com.salud.organization.WorkspaceQueryController queries;
    @Autowired ar.com.salud.patient.PatientController patients;
    @Autowired ReportController reports;
    @Autowired MfaService mfa;
    @Autowired ObjectMapper json;
    Db owner;
    UUID admin, professional, patientAccount, secretary, globalProfessional, careManager;
    Context c;
    Instant at;
    private static final AtomicInteger DAY=new AtomicInteger(10);
    record Context(UUID tenant,UUID agenda,UUID patient,UUID offer,UUID extraction,UUID professionalEntity,UUID patientProfessional) {}
    @BeforeEach void fixture() {
        owner=new Db(new JdbcTemplate(flyway.getConfiguration().getDataSource()));
        admin=account("admin@demo.test");professional=account("profesional@demo.test");
        patientAccount=account("paciente@demo.test");secretary=account("secretaria@demo.test");
        globalProfessional=db.id("select id from profesional_global where cuenta_id=?",professional);
        c=context();
        careManager=owner.id("insert into cuenta(nombre,email_acceso,estado,creada_en) values ('Gestión de pacientes',?,'ACTIVA',now()) returning id","care-"+UUID.randomUUID()+"@example.test");
        UUID careMember=owner.id("insert into membresia(tenant_id,cuenta_id,desde,estado) values (?,?,now(),'ACTIVA') returning id",c.tenant(),careManager);
        owner.update("insert into membresia_permiso(tenant_id,membresia_id,permiso_id,otorgante_id,desde) select ?,?,id,?,now() from permiso where codigo in ('patients:manage','admissions:manage','notifications:manage','catalog:manage','coverage:manage')",c.tenant(),careMember,admin);
        at=ZonedDateTime.now(ZoneId.of("America/Argentina/Buenos_Aires")).plusDays(DAY.incrementAndGet()).withHour(10).withMinute(0).withSecond(0).withNano(0).toInstant();
    }
    UUID account(String email) {return db.id("select id from cuenta where email_acceso=?",email);}
    Context context() {
        UUID tenant=owner.id("insert into entidad(tipo,nombre,zona_horaria,estado,creada_en) values ('CLINICA','Test','America/Argentina/Buenos_Aires','ACTIVA',now()) returning id");
        UUID member=owner.id("insert into membresia(tenant_id,cuenta_id,desde,estado) values (?,?,now(),'ACTIVA') returning id",tenant,professional);
        UUID adminMember=owner.id("insert into membresia(tenant_id,cuenta_id,desde,estado) values (?,?,now(),'ACTIVA') returning id",tenant,admin);
        owner.update("insert into membresia_permiso(tenant_id,membresia_id,permiso_id,otorgante_id,desde) select ?,?,id,?,now() from permiso where codigo in ('members:manage','patients:manage','admissions:manage','catalog:manage','professionals:manage','coverage:manage','policy:manage','audit:read','notifications:manage')",tenant,adminMember,admin);
        UUID pe=owner.id("insert into profesional_entidad(tenant_id,profesional_id,membresia_id,desde,estado) values (?,?,?,now(),'ACTIVO') returning id",tenant,globalProfessional,member);
        UUID branch=owner.id("insert into sede(tenant_id,nombre,zona_horaria,estado) values (?,'Test','America/Argentina/Buenos_Aires','ACTIVA') returning id",tenant);
        UUID agenda=owner.id("insert into agenda(tenant_id,profesional_entidad_id,sede_id,nombre,zona_horaria,estado) values (?,?,?,'Test','America/Argentina/Buenos_Aires','ACTIVA') returning id",tenant,pe,branch);
        for(int i=1;i<=7;i++)owner.update("insert into horario_agenda(tenant_id,agenda_id,dia_semana,hora_inicio,hora_fin,desde) values (?,?,?,'08:00','20:00',current_date)",tenant,agenda,i);
        UUID offer=null,extraction=null;
        for(String code:List.of("CONSULTA","EXTRACCION")) {
            UUID practice=owner.id("insert into practica(tenant_id,codigo_local,origen,base_inicial,estado) values (?,?,'BASE',?,'ACTIVA') returning id",tenant,code,code);
            UUID pv=owner.id("insert into version_practica(tenant_id,practica_id,numero_version,nombre,clasificacion,autor_id,creada_en) values (?,?,1,?,'TEST',?,now()) returning id",tenant,practice,code,admin);
            UUID o=owner.id("insert into oferta(tenant_id,agenda_id,practica_id,estado) values (?,?,?,'ACTIVA') returning id",tenant,agenda,practice);
            UUID ov=owner.id("insert into version_oferta(tenant_id,oferta_id,version_practica_id,numero_version,duracion_min,preparacion_min,cierre_min,modalidad,portal_habilitado,gestion_personal,particular_habilitado,desde) values (?,?,?,1,30,0,0,'PRESENCIAL',?,?,true,now()) returning id",tenant,o,pv,code.equals("CONSULTA"),!code.equals("CONSULTA"));
            if(code.equals("CONSULTA"))offer=ov;else extraction=ov;
        }
        UUID patient=owner.id("insert into paciente(tenant_id,nombres,apellidos,estado,estado_datos_cobertura) values (?,'Ficticio','Prueba','ACTIVO','PENDIENTE') returning id",tenant);
        UUID pp=owner.id("insert into paciente_profesional(tenant_id,profesional_id,profesional_entidad_id,paciente_id,numero_visible,estado,alta_en) values (?,?,?,?,1,'ACTIVO',now()) returning id",tenant,globalProfessional,pe,patient);
        owner.update("insert into contador_paciente(tenant_id,profesional_id,profesional_entidad_id,ultimo_confirmado,version) values (?,?,?,1,1)",tenant,globalProfessional,pe);
        UUID access=owner.id("insert into acceso_paciente(tenant_id,paciente_id,cuenta_id,aprobador_id,aprobado_en,activado_en,estado,vinculacion_ref) values (?,?,?,?,now(),now(),'ACTIVO','TEST') returning id",tenant,patient,patientAccount,admin);
        owner.update("insert into alcance_acceso(tenant_id,acceso_id,profesional_entidad_id,agenda_id,permiso_id,desde) select ?,?,?,?,id,now() from permiso where codigo in ('patient:read','booking:create','booking:read','booking:confirm','booking:cancel','booking:reschedule','chat:read','chat:write')",tenant,access,pe,agenda);
        owner.update("insert into politica_operativa(tenant_id,tipo,numero_version,parametros,desde,aprobador_id) values (?,'RESERVAS',1,'{\"holdMinutes\":5,\"maxActive\":3,\"automaticClose\":false}',now(),?)",tenant,admin);
        for(String channel:List.of("EMAIL","WHATSAPP")) {
            owner.update("insert into canal_entidad(tenant_id,canal,proveedor,cuenta_externa,remitente,secreto_ref,verificada_en,estado) values (?,?,'SIMULATED','TEST','TEST','TEST',now(),'ACTIVO')",tenant,channel);
            UUID contact=owner.id("insert into contacto_paciente(tenant_id,paciente_id,tipo,valor,verificado_en,estado) values (?,?,?,'ficticio@demo.test',now(),'ACTIVO') returning id",tenant,patient,channel);
            owner.update("insert into destino_aviso(tenant_id,paciente_id,contacto_id,canal,proposito,autorizacion_ref,desde) values (?,?,?,?,'TURNOS','TEST',now())",tenant,patient,contact,channel);
        }
        return new Context(tenant,agenda,patient,offer,extraction,pe,pp);
    }
    Map<String,Object> hold(Context ctx,Instant start,String key,UUID actor,UUID offer) {
        return tenants.run(ctx.tenant(),actor,() -> booking.hold(ctx.tenant(),actor,key,new BookingController.HoldInput(ctx.patient(),offer,start,null,null)));
    }
    UUID book(Context ctx,Instant start,String key) {
        UUID held=Db.uuid(hold(ctx,start,key,patientAccount,ctx.offer()),"id");
        return Db.uuid(tenants.run(ctx.tenant(),patientAccount,() -> booking.complete(ctx.tenant(),patientAccount,"book:"+key,held)),"id");
    }

    @Test void institutionalRoleCannotReadPatientsEvenWithLegacyGrants() {
        assertThatThrownBy(()->patients.patients(admin::toString,c.tenant())).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        assertThatThrownBy(()->communication.conversations(admin::toString,c.tenant())).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        assertThatThrownBy(()->queries.list(admin::toString,c.tenant(),"notifications",null,0,250)).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        var people=(List<Map<String,Object>>)staffExperience.directory(admin::toString,c.tenant());
        assertThat(people).hasSize(1);assertThat(people.getFirst()).doesNotContainKeys("paciente_id","turno_id","inicio_atencion");
        assertThat((List<?>)people.getFirst().get("hours")).hasSize(7);
    }
    @Test void provisionalStaffMustChangePasswordBeforeWorkspace() throws Exception {
        String email="new-"+UUID.randomUUID()+"@example.test";
        var result=(Map<?,?>)staffExperience.create(admin::toString,c.tenant(),new StaffExperienceController.NewStaff("Persona nueva",email,"SECRETARIA",null));
        UUID account=(UUID)result.get("id");String provisional=(String)result.get("temporaryPassword");
        assertThat(identity.authenticate(email,provisional,"provisional-test")).isEqualTo(account);
        var loginResult=mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType("application/json").content(json.writeValueAsString(Map.of("email",email,"password",provisional)))).andExpect(status().isOk()).andReturn();
        MockHttpSession session=(MockHttpSession)loginResult.getRequest().getSession(false);
        mvc.perform(get("/api/v1/entities/"+c.tenant()+"/workspace").session(session)).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/auth/provisional-password").session(session).with(csrf()).contentType("application/json").content(json.writeValueAsString(Map.of("password","personal-password-12345")))).andExpect(status().isOk());
        assertThat(identity.authenticate(email,"personal-password-12345","changed-test")).isEqualTo(account);
        assertThatThrownBy(()->identity.authenticate(email,provisional,"old-provisional-test")).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        assertThat(db.one("select cambio_clave_pendiente from cuenta where id=?",account).get("cambio_clave_pendiente")).isEqualTo(false);
        assertThatThrownBy(()->staffExperience.create(admin::toString,c.tenant(),new StaffExperienceController.NewStaff("Duplicada",email,"SECRETARIA",null))).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        var newProfessional=(Map<?,?>)staffExperience.create(admin::toString,c.tenant(),new StaffExperienceController.NewStaff("Profesional nuevo","pro-"+UUID.randomUUID()+"@example.test","PROFESIONAL","M.N. 34567"));
        UUID professionalAccount=(UUID)newProfessional.get("id");
        assertThat(((Map<?,?>)workspace.workspace(professionalAccount::toString,c.tenant())).get("professional")).isEqualTo(true);
    }
    @Test void agendaRequestRequiresOwnerApprovalAndCannotAuthorizeAdmin() {
        organization.member(admin::toString,c.tenant(),new OrganizationController.MemberInput(secretary,Set.of()));
        UUID request=(UUID)((Map<?,?>)staffExperience.requestAgenda(secretary::toString,c.tenant(),c.agenda())).get("id");
        assertThatThrownBy(()->staffExperience.resolve(admin::toString,c.tenant(),request,new StaffExperienceController.Decision(true))).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        assertThat(tenants.run(c.tenant(),secretary,()->authorization.agenda(secretary,c.agenda(),"booking:read"))).isFalse();
        staffExperience.resolve(professional::toString,c.tenant(),request,new StaffExperienceController.Decision(true));
        assertThat(tenants.run(c.tenant(),secretary,()->authorization.agenda(secretary,c.agenda(),"booking:reschedule"))).isTrue();
        assertThat(tenants.run(c.tenant(),secretary,()->authorization.agenda(secretary,c.agenda(),"agenda:configure"))).isFalse();
        assertThatThrownBy(()->staffExperience.requestAgenda(admin::toString,c.tenant(),c.agenda())).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }
    @Test void professionalRequestsNewInstitutionAndDepartureNoticeSurvivesRevocation() {
        UUID target=owner.id("insert into entidad(tipo,nombre,zona_horaria,estado,creada_en) values ('CLINICA','Nueva institución','America/Argentina/Buenos_Aires','ACTIVA',now()) returning id");
        UUID adminMember=owner.id("insert into membresia(tenant_id,cuenta_id,desde,estado) values (?,?,now(),'ACTIVA') returning id",target,admin);
        owner.update("insert into membresia_permiso(tenant_id,membresia_id,permiso_id,otorgante_id,desde) select ?,?,id,?,now() from permiso where codigo in ('professionals:manage','members:manage')",target,adminMember,admin);
        UUID request=(UUID)((Map<?,?>)staffExperience.requestInstitution(professional::toString,new StaffExperienceController.LinkInput(target,"Profesional","M.N. 123"))).get("id");
        assertThat(db.exists("select 1 from my_contexts(?) where id=?",professional,target)).isFalse();
        staffExperience.resolve(admin::toString,target,request,new StaffExperienceController.Decision(true));
        assertThat(db.exists("select 1 from my_contexts(?) where id=?",professional,target)).isTrue();
        UUID membership=owner.id("select id from membresia where tenant_id=? and cuenta_id=?",target,professional);
        organization.revokeMember(admin::toString,target,membership);
        assertThat(db.exists("select 1 from my_contexts(?) where id=?",professional,target)).isFalse();
        var notices=(List<Map<String,Object>>)staffExperience.notices(professional::toString);
        assertThat(notices).anySatisfy(n->assertThat(n.get("tipo")).isEqualTo("VINCULO_FINALIZADO"));
    }
    @Test void receptionAndCancelledAbsenceReassignmentRequireDelegation() {
        UUID appointment=book(c,at,"staff-reception");
        organization.member(admin::toString,c.tenant(),new OrganizationController.MemberInput(secretary,Set.of()));
        assertThatThrownBy(()->staffExperience.reception(secretary::toString,c.tenant(),appointment,new StaffExperienceController.Reception("ESPERA"))).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        UUID member=owner.id("select id from membresia where tenant_id=? and cuenta_id=?",c.tenant(),secretary);
        organization.delegate(professional::toString,c.tenant(),c.agenda(),new OrganizationController.DelegationInput(member,Set.of("agenda:read","booking:read","booking:confirm","booking:reschedule")));
        staffExperience.reception(secretary::toString,c.tenant(),appointment,new StaffExperienceController.Reception("ESPERA"));
        staffExperience.reception(secretary::toString,c.tenant(),appointment,new StaffExperienceController.Reception("ATENCION"));
        tenants.run(c.tenant(),professional,()->{booking.absence(c.tenant(),professional,c.agenda(),new BookingController.AbsenceInput(at.minusSeconds(60),at.plusSeconds(1800),"Ausencia"),"staff-absence");booking.cancel(c.tenant(),professional,appointment,"Ausencia profesional");return null;});
        assertThatThrownBy(()->tenants.run(c.tenant(),patientAccount,()->booking.reschedule(c.tenant(),patientAccount,appointment,"patient-restore",new BookingController.HoldInput(c.patient(),c.offer(),at.plusSeconds(3600),null,null)))).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        tenants.run(c.tenant(),secretary,()->booking.reschedule(c.tenant(),secretary,appointment,"staff-restore",new BookingController.HoldInput(c.patient(),c.offer(),at.plusSeconds(3600),null,null)));
        assertThat(owner.one("select estado_turno from turno where id=?",appointment).get("estado_turno")).isEqualTo("REGISTRADO");
        assertThat(owner.exists("select 1 from recepcion_turno where turno_id=?",appointment)).isFalse();
    }
    @Test void bookingPatientRegistrationRequiresSixFieldsAndCreatesProfessionalRelationship() throws Exception {
        delegateForTest(Set.of("agenda:read","booking:read","booking:create"));
        String dni=String.valueOf(10000000+Math.floorMod(UUID.randomUUID().hashCode(),89999999));
        var input=new ar.com.salud.patient.BookingPatientController.Registration("Nueva","Persona",dni,"persona@example.test","+5491112345678","Domicilio de prueba 123",true);
        var result=(Map<?,?>)bookingPatients.register(secretary::toString,c.tenant(),c.agenda(),input);
        UUID patient=(UUID)result.get("id");
        assertThat(owner.exists("select 1 from paciente_profesional where paciente_id=? and profesional_entidad_id=?",patient,c.professionalEntity())).isTrue();
        assertThat(owner.one("select identidad_global_id from paciente where id=?",patient).get("identidad_global_id")).isNotNull();
        assertThat(owner.list("select id from contacto_paciente where paciente_id=?",patient)).hasSize(2);
        assertThatThrownBy(()->bookingPatients.register(secretary::toString,c.tenant(),c.agenda(),input)).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        var session=login("secretaria@demo.test");
        mvc.perform(post("/api/v1/entities/"+c.tenant()+"/agendas/"+c.agenda()+"/booking-patients").session(session).with(csrf()).contentType("application/json").content(json.writeValueAsString(Map.of("firstName","Ana","lastName","Prueba","document","23456789","email","persona@example.test","phone","+5491112345678")))).andExpect(status().isBadRequest());
    }
    @Test void globalDocumentIdentityIsReusedWithoutSharingInstitutionalPatientData() {
        String dni=String.valueOf(10000000+Math.floorMod(UUID.randomUUID().hashCode(),89999999));
        var input=new ar.com.salud.patient.BookingPatientController.Registration("Una","Persona",dni,"una@example.test","+5491112345678","Dirección propia",false);
        UUID first=(UUID)((Map<?,?>)bookingPatients.register(professional::toString,c.tenant(),c.agenda(),input)).get("id");
        Context other=context();
        assertThat((List<?>)bookingPatients.match(professional::toString,other.tenant(),other.agenda(),dni)).isEmpty();
        UUID second=(UUID)((Map<?,?>)bookingPatients.register(professional::toString,other.tenant(),other.agenda(),input)).get("id");
        assertThat(first).isNotEqualTo(second);
        assertThat(owner.one("select identidad_global_id from paciente where id=?",first).get("identidad_global_id")).isEqualTo(owner.one("select identidad_global_id from paciente where id=?",second).get("identidad_global_id"));
        assertThat((List<?>)bookingPatients.match(professional::toString,c.tenant(),c.agenda(),dni)).hasSize(1);
    }
    @Test void existingInstitutionalPatientCanBeLinkedWithoutAnotherRegistration() {
        String dni=String.valueOf(10000000+Math.floorMod(UUID.randomUUID().hashCode(),89999999));
        UUID patient=owner.id("insert into paciente(tenant_id,nombres,apellidos,tipo_documento,documento_declarado,estado,estado_datos_cobertura) values (?,'Paciente','Existente','DNI',?,'ACTIVO','PENDIENTE') returning id",c.tenant(),dni);
        var matches=(List<Map<String,Object>>)bookingPatients.match(professional::toString,c.tenant(),c.agenda(),dni);
        assertThat(matches).hasSize(1);assertThat(matches.getFirst().get("vinculado")).isEqualTo(false);
        bookingPatients.link(professional::toString,c.tenant(),c.agenda(),patient,new ar.com.salud.patient.BookingPatientController.Existing(dni));
        bookingPatients.link(professional::toString,c.tenant(),c.agenda(),patient,new ar.com.salud.patient.BookingPatientController.Existing(dni));
        assertThat(owner.list("select id from paciente_profesional where paciente_id=?",patient)).hasSize(1);
        assertThatThrownBy(()->bookingPatients.match(patientAccount::toString,c.tenant(),c.agenda(),dni)).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }
    @Test void independentManagementIsLimitedToTheExplicitIndependentTenant() {
        owner.update("update entidad set tipo='INDEPENDIENTE' where id=?",c.tenant());
        tenants.run(c.tenant(),professional,()->{assertThat(authorization.independentOwner(professional)).isTrue();assertThat(authorization.staff(professional,"members:manage")).isTrue();assertThat(authorization.agenda(professional,c.agenda(),"booking:create")).isTrue();return null;});
        Context clinic=context();
        tenants.run(clinic.tenant(),professional,()->{assertThat(authorization.independentOwner(professional)).isFalse();assertThat(authorization.staff(professional,"members:manage")).isFalse();return null;});
        assertThat(((Map<?,?>)workspace.workspace(professional::toString,c.tenant())).get("independentOwner")).isEqualTo(true);
    }
    @Test void periodCancellationIsAtomicIdempotentAndNotifiesDelegatedSecretaryAndPatients() {
        organization.setPolicy(admin::toString,c.tenant(),new OrganizationController.PolicyInput(5,5,false,"Fixture de cancelación con cuatro reservas"));
        delegateForTest(Set.of("agenda:read","booking:read","booking:reschedule"));
        UUID first=book(c,at,"period-first"),second=book(c,at.plusSeconds(3600),"period-second"),outside=book(c,at.plusSeconds(86400),"period-outside");
        UUID started=book(c,at.plusSeconds(7200),"period-started-early");
        staffExperience.reception(professional::toString,c.tenant(),started,new StaffExperienceController.Reception("ATENCION"));
        tenants.run(c.tenant(),patientAccount,()->booking.confirm(c.tenant(),patientAccount,first));
        LocalDate date=at.atZone(ZoneId.of("America/Argentina/Buenos_Aires")).toLocalDate();
        var preview=(Map<?,?>)professionalWorkspace.preview(professional::toString,c.tenant(),c.agenda(),date,"day");assertThat(preview.get("count")).isEqualTo(2);
        assertThatThrownBy(()->professionalWorkspace.cancel(secretary::toString,c.tenant(),c.agenda(),"not-owner",new BookingService.PeriodCancellation(date,"day","Ausencia",2))).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        assertThatThrownBy(()->professionalWorkspace.cancel(professional::toString,c.tenant(),c.agenda(),"wrong-count",new BookingService.PeriodCancellation(date,"day","Ausencia",1))).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        var input=new BookingService.PeriodCancellation(date,"day","Ausencia del profesional",2);
        professionalWorkspace.cancel(professional::toString,c.tenant(),c.agenda(),"cancel-period-test",input);
        professionalWorkspace.cancel(professional::toString,c.tenant(),c.agenda(),"cancel-period-test",input);
        assertThat(owner.one("select estado_turno from turno where id=?",first).get("estado_turno")).isEqualTo("CANCELADO");
        assertThat(owner.one("select estado_turno from turno where id=?",second).get("estado_turno")).isEqualTo("CANCELADO");
        assertThat(owner.one("select estado_turno from turno where id=?",outside).get("estado_turno")).isEqualTo("REGISTRADO");
        assertThat(owner.one("select estado_turno from turno where id=?",started).get("estado_turno")).isEqualTo("REGISTRADO");
        assertThat(owner.list("select id from tarea_persistida where tenant_id=? and tipo like 'CANCELLED_PERIOD_%'",c.tenant())).hasSize(4);
        assertThat(owner.list("select id from aviso_interno where tenant_id=? and destinatario_id=? and tipo='AGENDA_PERIOD_CANCELLED'",c.tenant(),secretary)).hasSize(2);
        worker.processTenant(c.tenant());
        assertThat(owner.list("select id from tarea_persistida where tenant_id=? and tipo like 'CANCELLED_PERIOD_%' and estado='SIMULADA'",c.tenant())).hasSize(4);
    }
    @Test void professionalFeesAreVersionedAndActivityCountsExplicitFinalization() {
        UUID attended=book(c,at,"activity-attended"),cancelled=book(c,at.plusSeconds(3600),"activity-cancelled");
        staffExperience.reception(professional::toString,c.tenant(),attended,new StaffExperienceController.Reception("FINALIZADO"));
        tenants.run(c.tenant(),professional,()->booking.cancel(c.tenant(),professional,cancelled,"Prueba"));
        LocalDate date=at.atZone(ZoneId.of("America/Argentina/Buenos_Aires")).toLocalDate();
        var activity=(Map<?,?>)professionalWorkspace.activity(professional::toString,c.tenant(),c.agenda(),date,date.plusDays(1));var summary=(Map<?,?>)activity.get("summary");
        assertThat(((Number)summary.get("pacientes_atendidos")).intValue()).isEqualTo(1);assertThat(((Number)summary.get("cancelados")).intValue()).isEqualTo(1);assertThat(((Number)summary.get("proximos")).intValue()).isZero();
        professionalWorkspace.fee(professional::toString,c.tenant(),c.agenda(),new ProfessionalWorkspaceController.Fee(c.offer(),new java.math.BigDecimal("15000.50"),"ARS"));
        professionalWorkspace.fee(professional::toString,c.tenant(),c.agenda(),new ProfessionalWorkspaceController.Fee(c.offer(),new java.math.BigDecimal("16000.00"),"ARS"));
        var fees=(List<Map<String,Object>>)professionalWorkspace.fees(professional::toString,c.tenant(),c.agenda());assertThat(fees).hasSize(1);assertThat(fees.getFirst().get("numero_version")).isEqualTo(2);
    }
    @Test void institutionDirectoryRequiresSpecificGrantsAndNeverReturnsBookings() {
        for(String resource:List.of("institution-professionals","institution-members","institution-branches","institution-agendas","institution-audit")) {
            var result=(Map<?,?>)queries.list(admin::toString,c.tenant(),resource,null,0,250);
            assertThat(((Number)result.get("total")).longValue()).isGreaterThanOrEqualTo(0);
            assertThatThrownBy(()->queries.list(professional::toString,c.tenant(),resource,null,0,250))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        }
        var page=(Map<?,?>)queries.list(admin::toString,c.tenant(),"institution-professionals",null,0,250);
        var item=(Map<?,?>)((List<?>)page.get("items")).getFirst();
        assertThat(item.get("nombre")).isNotNull();
        assertThat(item.containsKey("paciente_id")).isFalse();
        assertThat(item.containsKey("inicio_atencion")).isFalse();
        var other=context();
        var agendas=(Map<?,?>)queries.list(admin::toString,c.tenant(),"institution-agendas",null,0,250);
        var agendaIds=((List<?>)agendas.get("items")).stream().map(r->(UUID)((Map<?,?>)r).get("id")).toList();
        assertThat(agendaIds).contains(c.agenda()).doesNotContain(other.agenda());
        assertThat(((Map<?,?>)organization.getPolicy(admin::toString,c.tenant())).get("hold_minutes")).isEqualTo(5);
        assertThatThrownBy(()->organization.getPolicy(professional::toString,c.tenant())).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }
    @Test void institutionPermissionsReplacePriorGrantsAndProtectSelfAdministration() {
        var result=(Map<?,?>)organization.member(admin::toString,c.tenant(),new OrganizationController.MemberInput(secretary,Set.of("patients:manage","admissions:manage")));
        UUID member=(UUID)result.get("id");
        organization.permissions(admin::toString,c.tenant(),member,new OrganizationController.PermissionsInput(Set.of("catalog:manage")));
        tenants.run(c.tenant(),secretary,()->{assertThat(authorization.staff(secretary,"catalog:manage")).isTrue();assertThat(authorization.staff(secretary,"patients:manage")).isFalse();return null;});
        assertThatThrownBy(()->organization.permissions(admin::toString,c.tenant(),member,new OrganizationController.PermissionsInput(Set.of("booking:read")))).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        organization.revokeMember(admin::toString,c.tenant(),member);
        organization.member(admin::toString,c.tenant(),new OrganizationController.MemberInput(secretary,Set.of()));
        tenants.run(c.tenant(),secretary,()->{assertThat(authorization.staff(secretary,"catalog:manage")).isFalse();return null;});
        UUID own=owner.id("select id from membresia where tenant_id=? and cuenta_id=?",c.tenant(),admin);
        assertThatThrownBy(()->organization.permissions(admin::toString,c.tenant(),own,new OrganizationController.PermissionsInput(Set.of()))).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        assertThatThrownBy(()->organization.revokeMember(admin::toString,c.tenant(),own)).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
    }
    @Test void institutionDepartureRevokesDelegationsAndPreservesIdentityAndOtherTenants() {
        var other=context();
        UUID member=owner.id("select id from membresia where tenant_id=? and cuenta_id=?",c.tenant(),professional);
        var secretaryMember=(Map<?,?>)organization.member(admin::toString,c.tenant(),new OrganizationController.MemberInput(secretary,Set.of()));
        UUID delegate=(UUID)((Map<?,?>)organization.delegate(professional::toString,c.tenant(),c.agenda(),new OrganizationController.DelegationInput((UUID)secretaryMember.get("id"),Set.of("agenda:read")))).get("id");
        organization.revokeMember(admin::toString,c.tenant(),member);
        assertThat(owner.one("select estado from profesional_entidad where id=?",c.professionalEntity()).get("estado")).isEqualTo("INACTIVO");
        assertThat(owner.one("select revocada_en from delegacion_agenda where id=?",delegate).get("revocada_en")).isNotNull();
        assertThat(owner.one("select estado from profesional_entidad where id=?",other.professionalEntity()).get("estado")).isEqualTo("ACTIVO");
        assertThat(owner.exists("select 1 from profesional_global where cuenta_id=?",professional)).isTrue();
        assertThat(owner.exists("select 1 from paciente_profesional where id=?",c.patientProfessional())).isTrue();
        var page=(Map<?,?>)queries.list(admin::toString,c.tenant(),"institution-professionals",null,0,250);
        assertThat(((Map<?,?>)((List<?>)page.get("items")).getFirst()).get("estado")).isEqualTo("INACTIVO");
    }
    @Test void institutionDepartureWithFutureBookingsKeepsMembershipActive() {
        book(c,at,"institution-departure");
        UUID member=owner.id("select id from membresia where tenant_id=? and cuenta_id=?",c.tenant(),professional);
        assertThatThrownBy(()->organization.revokeMember(admin::toString,c.tenant(),member)).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        assertThat(owner.one("select estado from membresia where id=?",member).get("estado")).isEqualTo("ACTIVA");
    }
    @Test void institutionDepartureWithActiveHoldPreservesItAndRejectsInactiveAgendaOwner() {
        hold(c,at,"departure-hold",patientAccount,c.offer());
        UUID member=owner.id("select id from membresia where tenant_id=? and cuenta_id=?",c.tenant(),professional);
        assertThatThrownBy(()->organization.revokeMember(admin::toString,c.tenant(),member)).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        assertThat(owner.one("select estado from membresia where id=?",member).get("estado")).isEqualTo("ACTIVA");
        UUID branch=owner.id("select sede_id from agenda where id=?",c.agenda());
        owner.update("update profesional_entidad set estado='INACTIVO' where id=?",c.professionalEntity());
        assertThatThrownBy(()->organization.agenda(admin::toString,c.tenant(),new OrganizationController.AgendaInput(c.professionalEntity(),branch,"Inactiva","America/Argentina/Buenos_Aires"))).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
    }
    @Test void migrationsAreValidAndUpToDate() {
        assertThat(flyway.validateWithResult().validationSuccessful).isTrue();
        assertThat(flyway.info().current().getVersion().getVersion()).isEqualTo("12");
        assertThat(flyway.info().pending()).isEmpty();
    }

    @Test void runtimeCannotBypassRlsOrCreateTables() {
        assertThat(jdbc.queryForObject("show timezone", String.class)).isEqualTo("UTC");
        assertThat(jdbc.queryForObject("select current_user", String.class)).isEqualTo("salud_app");
        assertThat(jdbc.queryForObject("select rolsuper or rolbypassrls from pg_roles where rolname = current_user",
                Boolean.class)).isFalse();
        assertThatThrownBy(() -> jdbc.execute("create table salud.forbidden_probe (id int)"))
                .isInstanceOf(org.springframework.dao.DataAccessException.class);
        assertThatThrownBy(() -> jdbc.queryForList("select * from salud.flyway_schema_history"))
                .isInstanceOf(org.springframework.dao.DataAccessException.class);
    }

    @Test void healthAndReadinessArePublicWithoutDatabaseDetails() throws Exception {
        for (String path : new String[]{"/actuator/health", "/actuator/health/liveness", "/actuator/health/readiness"}) {
            mvc.perform(get(path)).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"))
                    .andExpect(jsonPath("$.components").doesNotExist());
        }
    }

    @Test void privateAndManagementPathsAreProtected() throws Exception {
        mvc.perform(get("/api/v1/patients")).andExpect(status().isUnauthorized());
        mvc.perform(get("/actuator/env")).andExpect(status().isUnauthorized());
    }

    @Test void completeSchemaHasUuidV7AndForcedRls() {
        assertThat(owner.jdbc.queryForObject("select count(*) from pg_tables where schemaname='salud'",Integer.class)).isEqualTo(96);
        assertThat(c.tenant().version()).isEqualTo(7);
        assertThat(c.patient().version()).isEqualTo(7);
        assertThat(owner.jdbc.queryForObject("select bool_and(relrowsecurity and relforcerowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='salud' and c.relname in ('paciente','turno','mensaje','membresia')",Boolean.class)).isTrue();
    }
    @Test void contextDoesNotLeakThroughPoolAndForeignKeysRejectCrossTenant() {
        assertThat(db.list("select id from paciente")).isEmpty();
        tenants.run(c.tenant(),patientAccount,() -> {assertThat(db.list("select id from paciente")).hasSize(1);return null;});
        assertThat(db.list("select id from paciente")).isEmpty();
        Context other=context();
        assertThatThrownBy(() -> tenants.run(c.tenant(),admin,() -> db.update("insert into contacto_paciente(tenant_id,paciente_id,tipo,valor,estado) values (?,?,'EMAIL','test','ACTIVO')",c.tenant(),other.patient())))
            .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        assertThatThrownBy(() -> db.list("select * from ocupacion_global")).isInstanceOf(org.springframework.dao.DataAccessException.class);
    }
    @Test void idempotencyAndAttendanceAreIndependentAndAtomic() {
        UUID h=Db.uuid(hold(c,at,"same",patientAccount,c.offer()),"id");
        assertThat(hold(c,at,"same",patientAccount,c.offer()).get("id")).isEqualTo(h);
        assertThatThrownBy(() -> hold(c,at.plusSeconds(3600),"same",patientAccount,c.offer())).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        UUID id=Db.uuid(tenants.run(c.tenant(),patientAccount,() -> booking.complete(c.tenant(),patientAccount,"same-book",h)),"id");
        assertThat(tenants.run(c.tenant(),patientAccount,() -> booking.complete(c.tenant(),patientAccount,"same-book",h)).get("id")).isEqualTo(id);
        assertThat(owner.one("select estado_asistencia from turno where id=?",id).get("estado_asistencia")).isEqualTo("PENDIENTE");
        tenants.run(c.tenant(),patientAccount,() -> booking.confirm(c.tenant(),patientAccount,id));
        assertThat(owner.jdbc.queryForObject("select count(*) from tarea_persistida where tenant_id=?",Integer.class,c.tenant())).isEqualTo(3);
        assertThat(owner.jdbc.queryForObject("select count(*) from turno where tenant_id=?",Integer.class,c.tenant())).isEqualTo(1);
        assertThat(owner.one("select estado_asistencia from turno where id=?",id).get("estado_asistencia")).isEqualTo("CONFIRMADA");
    }
    @Test void onlyBaseConsultationCanBeChosenByPatient() {
        assertThatThrownBy(() -> hold(c,at,"extract",patientAccount,c.extraction())).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        assertThat(hold(c,at,"staff-extract",professional,c.extraction())).containsKey("id");
    }
    @Test void expiredHoldCannotBecomeAppointmentOrBlockNewReservation() {
        UUID h=Db.uuid(hold(c,at,"old",patientAccount,c.offer()),"id");
        owner.update("update pre_reserva set vence_en=now()-interval '1 second' where id=?",h);
        owner.update("update ocupacion_global set vence_en=now()-interval '1 second' where id=(select ocupacion_id from pre_reserva where id=?)",h);
        assertThatThrownBy(() -> tenants.run(c.tenant(),patientAccount,() -> booking.complete(c.tenant(),patientAccount,"expired",h))).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        assertThat(hold(c,at,"new",patientAccount,c.offer())).containsKey("id");
    }
    @Test void competingEntitiesCannotDoubleBookGlobalProfessional() throws Exception {
        Context other=context();var barrier=new CyclicBarrier(2);
        try(var pool=Executors.newVirtualThreadPerTaskExecutor()) {
            Callable<Boolean> first=() -> {barrier.await();try{hold(c,at,"race-a",patientAccount,c.offer());return true;}catch(org.springframework.dao.DataIntegrityViolationException e){return false;}};
            Callable<Boolean> second=() -> {barrier.await();try{hold(other,at,"race-b",patientAccount,other.offer());return true;}catch(org.springframework.dao.DataIntegrityViolationException e){return false;}};
            var a=pool.submit(first);var b=pool.submit(second);
            assertThat(List.of(a.get(20,TimeUnit.SECONDS),b.get(20,TimeUnit.SECONDS))).containsExactlyInAnyOrder(true,false);
        }
    }
    @Test void quotaIncludesConfirmedAppointments() {
        for(int i=0;i<3;i++){UUID id=book(c,at.plusSeconds(i*3600L),"quota"+i);tenants.run(c.tenant(),patientAccount,() -> booking.confirm(c.tenant(),patientAccount,id));}
        assertThatThrownBy(() -> hold(c,at.plusSeconds(4*3600L),"over-quota",patientAccount,c.offer())).isInstanceOf(org.springframework.web.server.ResponseStatusException.class).hasMessageContaining("429");
    }
    @Test void failedMovePreservesOriginalAndCancellationIsRepeatable() {
        UUID id=book(c,at,"original");
        hold(c,at.plusSeconds(3600),"busy",patientAccount,c.offer());
        assertThatThrownBy(() -> tenants.run(c.tenant(),patientAccount,() -> booking.reschedule(c.tenant(),patientAccount,id,"move",new BookingController.HoldInput(c.patient(),c.offer(),at.plusSeconds(3600),null,null)))).isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        assertThat(owner.jdbc.queryForObject("select inicio_atencion from version_turno where turno_id=? and sustituida_en is null",java.sql.Timestamp.class,id).toInstant()).isEqualTo(at);
        Context competitor=context();
        assertThatThrownBy(() -> hold(competitor,at,"original-still-busy",patientAccount,competitor.offer())).isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        tenants.run(c.tenant(),patientAccount,() -> booking.cancel(c.tenant(),patientAccount,id,"Prueba"));
        tenants.run(c.tenant(),patientAccount,() -> booking.cancel(c.tenant(),patientAccount,id,"Prueba repetida"));
        assertThat(hold(c,at,"free-again",patientAccount,c.offer())).containsKey("id");
    }
    @Test void successfulMoveChangesVersionAndKeepsHistory() {
        UUID id=book(c,at,"move-original");
        tenants.run(c.tenant(),patientAccount,() -> booking.reschedule(c.tenant(),patientAccount,id,"successful-move",new BookingController.HoldInput(c.patient(),c.offer(),at.plusSeconds(3600),null,null)));
        assertThat(owner.jdbc.queryForObject("select count(*) from version_turno where turno_id=?",Integer.class,id)).isEqualTo(2);
        assertThat(owner.jdbc.queryForObject("select count(*) from version_turno where turno_id=? and sustituida_en is null",Integer.class,id)).isEqualTo(1);
        Context other=context();assertThat(hold(other,at,"old-slot-free",patientAccount,other.offer())).containsKey("id");
    }
    @Test void absenceNotifiesConfirmedAndPendingAppointmentsExactlyOnce() {
        UUID first=book(c,at,"absence-first");book(c,at.plusSeconds(3600),"absence-second");
        tenants.run(c.tenant(),patientAccount,() -> booking.confirm(c.tenant(),patientAccount,first));
        var input=new BookingController.AbsenceInput(at.minusSeconds(60),at.plusSeconds(7200),"Motivo ficticio");
        for(int i=0;i<2;i++)tenants.run(c.tenant(),professional,() -> {booking.absence(c.tenant(),professional,c.agenda(),input,"absence");return null;});
        worker.processTenant(c.tenant());
        assertThat(owner.jdbc.queryForObject("select count(*) from turno_afectado where tenant_id=?",Integer.class,c.tenant())).isEqualTo(2);
        assertThat(owner.jdbc.queryForObject("select count(*) from tarea_persistida where tenant_id=? and tipo='ABSENCE_WHATSAPP' and estado='SIMULADA'",Integer.class,c.tenant())).isEqualTo(2);
    }
    @Test void unapprovedOrRevokedPatientHasNoBookingAccess() {
        owner.update("update acceso_paciente set estado='APROBADO',activado_en=null where tenant_id=?",c.tenant());
        assertThatThrownBy(() -> hold(c,at,"pending",patientAccount,c.offer())).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        owner.update("update acceso_paciente set estado='REVOCADO' where tenant_id=?",c.tenant());
        assertThatThrownBy(() -> hold(c,at,"revoked",patientAccount,c.offer())).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }
    @Test void agendaDelegationDoesNotGrantChatAndRevocationIsImmediate() {
        UUID member=owner.id("insert into membresia(tenant_id,cuenta_id,desde,estado) values (?,?,now(),'ACTIVA') returning id",c.tenant(),secretary);
        UUID d=owner.id("insert into delegacion_agenda(tenant_id,agenda_id,membresia_id,otorgante_profesional_id,desde) values (?,?,?,?,now()) returning id",c.tenant(),c.agenda(),member,c.professionalEntity());
        owner.update("insert into delegacion_permiso(tenant_id,delegacion_id,permiso_id) select ?,?,id from permiso where codigo='agenda:read'",c.tenant(),d);
        tenants.run(c.tenant(),secretary,() -> {assertThat(authorization.agenda(secretary,c.agenda(),"agenda:read")).isTrue();assertThat(authorization.agenda(secretary,c.agenda(),"booking:create")).isFalse();return null;});
        var conversation=(Map<?,?>)communication.conversation(patientAccount::toString,c.tenant(),new CommunicationController.ConversationInput(c.patientProfessional()));
        UUID id=(UUID)conversation.get("id");
        communication.message(patientAccount::toString,c.tenant(),id,new CommunicationController.MessageInput("Consulta ficticia sin cambios de turno"));
        assertThat(((List<?>)((Map<?,?>)communication.conversationPage(secretary::toString,c.tenant(),0)).get("items"))).isEmpty();
        assertThat(((List<?>)((Map<?,?>)communication.conversationPage(professional::toString,c.tenant(),0)).get("items"))).hasSize(1);
        assertThatThrownBy(() -> communication.messages(secretary::toString,c.tenant(),id,null)).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        owner.update("update delegacion_agenda set revocada_en=now() where id=?",d);
        tenants.run(c.tenant(),secretary,() -> {assertThat(authorization.agenda(secretary,c.agenda(),"agenda:read")).isFalse();return null;});
        assertThat(owner.jdbc.queryForObject("select count(*) from turno where tenant_id=?",Integer.class,c.tenant())).isZero();
    }
    @Test void numberingIsStableUnderConcurrentLinking() throws Exception {
        UUID patient=owner.id("insert into paciente(tenant_id,nombres,apellidos,estado,estado_datos_cobertura) values (?,'Nuevo','Ficticio','ACTIVO','PENDIENTE') returning id",c.tenant());
        var input=new ar.com.salud.patient.PatientController.LinkInput(c.professionalEntity());
        try(var pool=Executors.newVirtualThreadPerTaskExecutor()) {
            var a=pool.submit(() -> patients.link(careManager::toString,c.tenant(),patient,input));
            var b=pool.submit(() -> patients.link(careManager::toString,c.tenant(),patient,input));
            assertThat(a.get(20,TimeUnit.SECONDS)).isEqualTo(b.get(20,TimeUnit.SECONDS));
        }
        assertThat(owner.jdbc.queryForObject("select numero_visible from paciente_profesional where tenant_id=? and paciente_id=?",Integer.class,c.tenant(),patient)).isEqualTo(2);
    }
    @Test void workerRespectsConfirmationAndDoesNotCloseWithoutApprovedPolicy() {
        UUID id=book(c,at,"worker");
        owner.update("update tarea_persistida set programada_en=now() where tenant_id=? and tipo='CLOSE_UNCONFIRMED'",c.tenant());
        worker.processTenant(c.tenant());
        assertThat(owner.one("select estado_turno from turno where id=?",id).get("estado_turno")).isEqualTo("REGISTRADO");
        assertThat(owner.jdbc.queryForObject("select count(*) from aviso_interno where tenant_id=? and tipo='CLOSE_REQUIRES_REVIEW'",Integer.class,c.tenant())).isPositive();
    }
    @Test void realSessionRequiresCsrfAndRecoveryRevokesIt() throws Exception {
        UUID user=owner.id("insert into cuenta(nombre,email_acceso,email_verificado_en,estado,creada_en) values ('Prueba recuperación','recovery@demo.test',now(),'ACTIVA',now()) returning id");
        var encoder=org.springframework.security.crypto.factory.PasswordEncoderFactories.createDelegatingPasswordEncoder();
        owner.update("insert into credencial_local(cuenta_id,hash_contrasena,algoritmo_version,actualizada_en) values (?,?,'bcrypt',now())",user,encoder.encode("integration-test-only-password"));
        mvc.perform(post("/api/v1/auth/login").contentType("application/json").content("{\"email\":\"recovery@demo.test\",\"password\":\"integration-test-only-password\"}")).andExpect(status().isForbidden());
        var result=mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType("application/json").content("{\"email\":\"recovery@demo.test\",\"password\":\"integration-test-only-password\"}")).andExpect(status().isOk()).andReturn();
        var session=(MockHttpSession)result.getRequest().getSession(false);
        mvc.perform(get("/api/v1/auth/me").session(session)).andExpect(status().isOk());
        identity.recover("recovery@demo.test","test");
        String link=secrets.decrypt((String)owner.one("select d.encrypted_link from identity_delivery d join token_identidad t on t.id=d.token_id where t.cuenta_id=?",user).get("encrypted_link"));
        String token=link.substring(link.indexOf("?token=")+7);identity.consume(token,"changed-integration-password");
        mvc.perform(get("/api/v1/auth/me").session(session)).andExpect(status().isUnauthorized());
        assertThatThrownBy(() -> identity.consume(token,"changed-integration-password")).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        assertThat(identity.authenticate("recovery@demo.test","changed-integration-password","test")).isEqualTo(user);
    }
    @Test void administrativeReportProducesAllThreeFormatsWithAuthorization() {
        book(c,at,"report");
        LocalDate day=at.atZone(ZoneId.of("America/Argentina/Buenos_Aires")).toLocalDate();
        for(String format:List.of("csv","xlsx","pdf")) {
            var response=reports.export(professional::toString,c.tenant(),c.agenda(),day,day,format);
            assertThat(response.getBody()).isNotEmpty();
            if(format.equals("pdf"))assertThat(new String(response.getBody(),0,5,java.nio.charset.StandardCharsets.US_ASCII)).isEqualTo("%PDF-");
        }
        assertThatThrownBy(() -> reports.export(patientAccount::toString,c.tenant(),c.agenda(),day,day,"csv")).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }
    @Test void unsignedWebhookIsRejectedWithoutSession() throws Exception {
        mvc.perform(post("/api/v1/delivery-events").header("X-Delivery-Timestamp",Instant.now().getEpochSecond()).header("X-Delivery-Signature","invalid").contentType("application/json").content("{}")).andExpect(status().isUnauthorized());
    }
    @Test void mfaRejectsReplayAndRequiresFreshVerificationAfterLogin() throws Exception {
        UUID user=owner.id("insert into cuenta(nombre,email_acceso,email_verificado_en,estado,creada_en) values ('MFA ficticio','mfa@demo.test',now(),'ACTIVA',now()) returning id");
        var encoder=org.springframework.security.crypto.factory.PasswordEncoderFactories.createDelegatingPasswordEncoder();
        owner.update("insert into credencial_local(cuenta_id,hash_contrasena,algoritmo_version,actualizada_en) values (?,?,'bcrypt',now())",user,encoder.encode("integration-test-only-password"));
        owner.update("insert into facultad_plataforma(cuenta_id,permiso_id,otorgante_id,desde) select ?,id,?,now() from permiso where codigo='entities:manage'",user,admin);
        mfa.enroll(user,"integration-test-only-password","mfa-test");
        var first=login("mfa@demo.test");
        byte[] key=Base64.getDecoder().decode(secrets.decrypt((String)owner.one("select referencia_secreta from factor_mfa where cuenta_id=? and revocado_en is null",user).get("referencia_secreta")));
        long counter=Instant.now().getEpochSecond()/30;
        String code=MfaService.totp(key,counter,6);
        mfa.verify(user,code,first.getId());
        assertThatThrownBy(() -> mfa.verify(user,code,first.getId())).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        var second=login("mfa@demo.test");
        mvc.perform(get("/api/v1/dev/mailbox").session(second)).andExpect(status().isForbidden());
        mfa.verify(user,MfaService.totp(key,counter+1,6),second.getId());
        mvc.perform(get("/api/v1/dev/mailbox").session(second)).andExpect(status().isOk());
    }
    MockHttpSession login(String email)throws Exception {
        var response=mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType("application/json").content(json.writeValueAsString(Map.of("email",email,"password","integration-test-only-password")))).andExpect(status().isOk()).andReturn();
        return (MockHttpSession)response.getRequest().getSession(false);
    }
    @Test void staleWorkerLeaseResumesWithoutCreatingDuplicateMessages() {
        book(c,at,"lease");
        owner.update("update tarea_persistida set estado='EJECUTANDO',bloqueada_hasta=now()-interval '1 second',intentos=1 where tenant_id=? and tipo='CONFIRMATION_EMAIL'",c.tenant());
        worker.processTenant(c.tenant());worker.processTenant(c.tenant());
        assertThat(owner.jdbc.queryForObject("select count(*) from aviso_externo a join tarea_persistida t on t.id=a.tarea_id and t.tenant_id=a.tenant_id where t.tenant_id=? and t.tipo='CONFIRMATION_EMAIL'",Integer.class,c.tenant())).isEqualTo(1);
        assertThat(owner.jdbc.queryForObject("select count(*) from intento_envio where tenant_id=?",Integer.class,c.tenant())).isEqualTo(1);
    }
    @Test void coverageDoesNotSilentlyFallBackToPrivatePayment() {
        UUID coverage=owner.id("insert into cobertura_medica(tenant_id,nombre,estado) values (?,'Cobertura ficticia','ACTIVA') returning id",c.tenant());
        UUID affiliation=owner.id("insert into afiliacion_paciente(tenant_id,paciente_id,cobertura_id,estado_verificacion) values (?,?,?,'PENDIENTE') returning id",c.tenant(),c.patient(),coverage);
        assertThatThrownBy(() -> tenants.run(c.tenant(),patientAccount,() -> booking.hold(c.tenant(),patientAccount,"coverage-pending",new BookingController.HoldInput(c.patient(),c.offer(),at,affiliation,null)))).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        assertThat(owner.jdbc.queryForObject("select count(*) from pre_reserva where tenant_id=?",Integer.class,c.tenant())).isZero();
        owner.update("update afiliacion_paciente set estado_verificacion='VERIFICADA' where id=?",affiliation);
        UUID offer=owner.id("select oferta_id from version_oferta where id=?",c.offer());
        UUID agreement=owner.id("insert into convenio(tenant_id,oferta_id,cobertura_id,estado) values (?,?,?,'ACTIVO') returning id",c.tenant(),offer,coverage);
        owner.update("insert into version_convenio(tenant_id,convenio_id,numero_version,desde,requiere_autorizacion,resultado_regla,condiciones) values (?,?,1,now(),false,'PERMITIDA','{}')",c.tenant(),agreement);
        assertThat(tenants.run(c.tenant(),patientAccount,() -> booking.hold(c.tenant(),patientAccount,"coverage-ok",new BookingController.HoldInput(c.patient(),c.offer(),at,affiliation,null)))).containsKey("id");
    }
    @Test void newAccountActivationIsSingleUseAndDoesNotAdmitItByItself() {
        UUID user=identity.invite("Invitado ficticio","activation@demo.test");
        String link=secrets.decrypt((String)owner.one("select d.encrypted_link from identity_delivery d join token_identidad t on t.id=d.token_id where t.cuenta_id=?",user).get("encrypted_link"));
        String token=link.substring(link.indexOf("?token=")+7);
        identity.consume(token,"integration-activation-password");
        assertThat(db.list("select * from my_contexts(?)",user)).isEmpty();
        assertThatThrownBy(() -> identity.consume(token,"integration-activation-password")).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
    }
    @Test void signedDeliveryWebhookIsDeduplicatedAndCannotConfirmAttendance()throws Exception {
        UUID appointment=book(c,at,"callback");
        owner.update("update tarea_persistida set programada_en=now() where tenant_id=? and tipo='CONFIRMATION_EMAIL'",c.tenant());
        worker.processTenant(c.tenant());
        var message=owner.one("select a.id,a.canal_id from aviso_externo a join tarea_persistida t on t.id=a.tarea_id and t.tenant_id=a.tenant_id where t.tenant_id=? and t.tipo='CONFIRMATION_EMAIL'",c.tenant());
        String raw=json.writeValueAsString(new DeliveryWebhookController.Event(c.tenant(),Db.uuid(message,"canal_id"),Db.uuid(message,"id"),"event-1","DELIVERED",Instant.now()));
        String timestamp=Long.toString(Instant.now().getEpochSecond());
        var mac=javax.crypto.Mac.getInstance("HmacSHA256");mac.init(new javax.crypto.spec.SecretKeySpec("integration-only-callback-secret-123456789".getBytes(java.nio.charset.StandardCharsets.UTF_8),"HmacSHA256"));
        String signature=HexFormat.of().formatHex(mac.doFinal((timestamp+"."+raw).getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        for(int i=0;i<2;i++)mvc.perform(post("/api/v1/delivery-events").header("X-Delivery-Timestamp",timestamp).header("X-Delivery-Signature",signature).contentType("application/json").content(raw)).andExpect(status().isOk());
        assertThat(owner.jdbc.queryForObject("select count(*) from evento_proveedor where tenant_id=?",Integer.class,c.tenant())).isEqualTo(1);
        assertThat(owner.one("select estado from aviso_externo where id=?",message.get("id")).get("estado")).isEqualTo("ENTREGADO");
        assertThat(owner.one("select estado_asistencia from turno where id=?",appointment).get("estado_asistencia")).isEqualTo("PENDIENTE");
    }
    @Test void availabilityHidesGlobalOccupancyDetailsAndRejectsNonConsultation() {
        var date=at.atZone(ZoneId.of("America/Argentina/Buenos_Aires")).toLocalDate();
        var before=(Map<?,?>)bookingController.available(patientAccount::toString,c.tenant(),c.offer(),c.patient(),date);
        assertThat(((Collection<?>)before.get("starts")).contains(at)).isTrue();
        Context other=context();hold(other,at,"availability-busy",patientAccount,other.offer());
        var after=(Map<?,?>)bookingController.available(patientAccount::toString,c.tenant(),c.offer(),c.patient(),date);
        assertThat(((Collection<?>)after.get("starts")).contains(at)).isFalse();
        assertThat(after.keySet()).isEqualTo(Set.of("starts","timezone","durationMinutes"));
        assertThatThrownBy(() -> bookingController.available(patientAccount::toString,c.tenant(),c.extraction(),c.patient(),date)).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }
    @Test void ownPatientCanBeDiscoveredWithAgendaScopedPermission()throws Exception {
        tenants.run(c.tenant(),patientAccount,() -> {assertThat(authorization.patient(patientAccount,c.patient(),null,"patient:read")).isTrue();return null;});
        var session=login("paciente@demo.test");
        mvc.perform(get("/api/v1/my-patients/"+c.tenant()).session(session)).andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(c.patient().toString()));
    }
    @Test void workspaceProjectionKeepsAdministrativeAndAgendaGrantsSeparate() {
        var administrative=(Map<?,?>)workspace.workspace(admin::toString,c.tenant());
        assertThat((Collection<?>)administrative.get("agendas")).isEmpty();
        assertThat(((Collection<?>)administrative.get("permissions")).contains("patients:manage")).isFalse();
        var professionalView=(Map<?,?>)workspace.workspace(professional::toString,c.tenant());
        var owned=(List<Map<String,Object>>)professionalView.get("agendas");
        assertThat(owned).hasSize(1);
        assertThat(owned.getFirst().get("titular")).isEqualTo(true);
        assertThat((Collection<?>)owned.getFirst().get("permissions")).hasSize(7);
        assertThat((Collection<?>)professionalView.get("permissions")).isEmpty();
        var patientView=(Map<?,?>)workspace.workspace(patientAccount::toString,c.tenant());
        assertThat((Collection<?>)patientView.get("agendas")).isEmpty();
        assertThat((Collection<?>)patientView.get("members")).isEmpty();
        assertThat(((Map<?,?>)workspace.coverageConfiguration(admin::toString,c.tenant())).containsKey("plans")).isTrue();
        var directory=(List<Map<String,Object>>)patients.patients(careManager::toString,c.tenant());
        assertThat(directory).hasSize(1);
        assertThat(directory.getFirst().get("numeros")).isEqualTo("1");
        assertThat(directory.getFirst().get("profesionales")).isEqualTo(c.professionalEntity().toString());
    }
    @Test void workspaceProjectionReflectsDelegationRevocationAndProtectsPatientReferences() {
        UUID member=owner.id("insert into membresia(tenant_id,cuenta_id,desde,estado) values (?,?,now(),'ACTIVA') returning id",c.tenant(),secretary);
        var delegated=(Map<?,?>)organization.delegate(professional::toString,c.tenant(),c.agenda(),new OrganizationController.DelegationInput(member,Set.of("agenda:read","booking:read")));
        var view=(Map<?,?>)workspace.workspace(secretary::toString,c.tenant());
        var agendas=(List<Map<String,Object>>)view.get("agendas");
        assertThat(agendas).hasSize(1);
        assertThat((Collection<?>)agendas.getFirst().get("permissions")).hasSize(2);
        assertThat((Collection<?>)view.get("members")).isEmpty();
        assertThatThrownBy(()->workspace.coverageConfiguration(secretary::toString,c.tenant())).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        assertThatThrownBy(()->workspace.patientReferences(secretary::toString,c.tenant(),c.patient())).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        assertThat(((Map<?,?>)workspace.patientReferences(patientAccount::toString,c.tenant(),c.patient())).containsKey("contacts")).isTrue();
        organization.revokeDelegation(professional::toString,c.tenant(),c.agenda(),(UUID)delegated.get("id"));
        var revoked=(Map<?,?>)workspace.workspace(secretary::toString,c.tenant());
        assertThat((Collection<?>)revoked.get("agendas")).isEmpty();
        assertThatThrownBy(()->workspace.workspace(UUID.randomUUID()::toString,c.tenant())).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    UUID delegateForTest(Set<String> grants) {
        UUID member=owner.id("insert into membresia(tenant_id,cuenta_id,desde,estado) values (?,?,now(),'ACTIVA') returning id",c.tenant(),secretary);
        return (UUID)((Map<?,?>)organization.delegate(professional::toString,c.tenant(),c.agenda(),new OrganizationController.DelegationInput(member,grants))).get("id");
    }
    @Test void bookingProjectionIsUsefulWithoutDisclosingAnAdministrativeFile() {
        UUID delegation=delegateForTest(Set.of("agenda:read","booking:read","booking:create"));
        var result=(Map<?,?>)queries.candidates(secretary::toString,c.tenant(),c.agenda(),"Prueba",0,100);
        var rows=(List<Map<String,Object>>)result.get("items");assertThat(rows).hasSize(1);
        assertThat(rows.getFirst().keySet()).isEqualTo(Set.of("id","nombres","apellidos","numero_visible"));
        assertThatThrownBy(()->queries.directory(secretary::toString,c.tenant(),0,250)).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        assertThatThrownBy(()->workspace.patientReferences(secretary::toString,c.tenant(),c.patient())).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        LocalDate date=at.atZone(ZoneId.of("America/Argentina/Buenos_Aires")).toLocalDate();
        var eligible=(Map<?,?>)queries.eligibility(secretary::toString,c.tenant(),c.agenda(),c.patient(),c.offer(),date,null);
        assertThat(eligible.keySet()).isEqualTo(Set.of("affiliations","authorizations","privatePaymentEnabled"));
        assertThatThrownBy(()->queries.candidates(patientAccount::toString,c.tenant(),c.agenda(),"",0,100)).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        organization.revokeDelegation(professional::toString,c.tenant(),c.agenda(),delegation);
        assertThatThrownBy(()->queries.eligibility(secretary::toString,c.tenant(),c.agenda(),c.patient(),c.offer(),date,null)).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }
    @Test void aRescheduleDelegationDoesNotRequireCreateAndKeepsOwnOverlappingCapacity() {
        delegateForTest(Set.of("agenda:read","booking:read","booking:reschedule"));
        UUID appointment=book(c,at,"reschedule-only");
        tenants.run(c.tenant(),patientAccount,()->booking.confirm(c.tenant(),patientAccount,appointment));
        LocalDate date=at.atZone(ZoneId.of("America/Argentina/Buenos_Aires")).toLocalDate();
        var available=(Map<?,?>)bookingController.reschedulingAvailability(secretary::toString,c.tenant(),c.offer(),c.patient(),date,appointment);
        assertThat(((Collection<?>)available.get("starts")).contains(at)).isTrue();
        assertThatThrownBy(()->hold(c,at.plusSeconds(7200),"cannot-create",secretary,c.offer())).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        tenants.run(c.tenant(),secretary,()->booking.reschedule(c.tenant(),secretary,appointment,"reschedule-permission",new BookingController.HoldInput(c.patient(),c.offer(),at.plusSeconds(900),null,null),2L));
        var result=tenants.run(c.tenant(),secretary,()->booking.booking(secretary,appointment,"booking:read",false));
        assertThat(result.get("estado_asistencia")).isEqualTo("PENDIENTE");assertThat(Db.instant(result,"inicio_atencion")).isEqualTo(at.plusSeconds(900));
    }
    @Test void versionPreconditionsPreventActionsOnAnAppointmentChangedInAnotherScreen() throws Exception {
        UUID appointment=book(c,at,"versioned");var session=login("paciente@demo.test");
        String uri="/api/v1/entities/"+c.tenant()+"/appointments/"+appointment;
        mvc.perform(post(uri+"/confirm").session(session).with(csrf())).andExpect(status().isPreconditionRequired());
        mvc.perform(post(uri+"/confirm").session(session).with(csrf()).header("If-Match","1")).andExpect(status().isBadRequest());
        mvc.perform(post(uri+"/confirm").session(session).with(csrf()).header("If-Match","\"1\"")).andExpect(status().isOk());
        mvc.perform(post(uri+"/cancel").session(session).with(csrf()).header("If-Match","\"1\"").contentType("application/json").content("{\"reason\":\"stale screen\"}")).andExpect(status().isPreconditionFailed());
        var current=tenants.run(c.tenant(),patientAccount,()->booking.booking(patientAccount,appointment,"booking:read",false));
        assertThat(current.get("estado_turno")).isEqualTo("REGISTRADO");assertThat(((Number)current.get("version_concurrencia")).longValue()).isEqualTo(2L);
    }
    @Test void pagedDirectoryAndCalendarDoNotSilentlyTruncateAtOneHundred() {
        owner.update("insert into paciente(tenant_id,nombres,apellidos,estado,estado_datos_cobertura) select ?,'Sintético', 'Carga '||g,'ACTIVO','PENDIENTE' from generate_series(1,10000) g",c.tenant());
        var first=(Map<?,?>)queries.directory(careManager::toString,c.tenant(),0,500);
        var last=(Map<?,?>)queries.directory(careManager::toString,c.tenant(),10000,500);
        assertThat(((Number)first.get("total")).longValue()).isEqualTo(10001);
        assertThat((List<?>)first.get("items")).hasSize(500);assertThat((List<?>)last.get("items")).hasSize(1);
        for(int i=0;i<105;i++) {
            UUID patient=(UUID)((Map<?,?>)patients.create(careManager::toString,c.tenant(),new ar.com.salud.patient.PatientController.PatientInput("Agenda","Carga "+i,null,null,null))).get("id");
            patients.link(careManager::toString,c.tenant(),patient,new ar.com.salud.patient.PatientController.LinkInput(c.professionalEntity()));
            Instant start=at.plus(100,java.time.temporal.ChronoUnit.DAYS).atZone(ZoneId.of("America/Argentina/Buenos_Aires")).withHour(8+i%12).plusDays(i/12).toInstant();
            UUID held=Db.uuid(tenants.run(c.tenant(),professional,()->booking.hold(c.tenant(),professional,"load-"+patient,new BookingController.HoldInput(patient,c.offer(),start,null,null))),"id");
            tenants.run(c.tenant(),professional,()->booking.complete(c.tenant(),professional,"load-book-"+patient,held));
        }
        LocalDate from=at.plus(100,java.time.temporal.ChronoUnit.DAYS).atZone(ZoneId.of("America/Argentina/Buenos_Aires")).toLocalDate();
        var page1=(Map<?,?>)queries.appointments(professional::toString,c.tenant(),c.agenda(),from,from.plusDays(12),0,100);
        var page2=(Map<?,?>)queries.appointments(professional::toString,c.tenant(),c.agenda(),from,from.plusDays(12),100,100);
        assertThat(((Number)page1.get("total")).longValue()).isEqualTo(105);
        assertThat((List<?>)page1.get("items")).hasSize(100);assertThat((List<?>)page2.get("items")).hasSize(5);
        assertThat(((List<Map<String,Object>>)page1.get("items")).getFirst()).containsKeys("version_concurrencia","practica","nombres","modalidad_elegida");
        assertThatThrownBy(()->queries.appointments(professional::toString,c.tenant(),c.agenda(),from,from.plusDays(94),0,100)).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
    }
    @Test void rangedCalendarAndCandidateSearchCannotCrossTenantOrAgendaPermissions() {
        book(c,at,"projection-scope");Context other=context();LocalDate from=at.plus(100,java.time.temporal.ChronoUnit.DAYS).atZone(ZoneId.of("America/Argentina/Buenos_Aires")).toLocalDate();
        assertThatThrownBy(()->queries.appointments(admin::toString,c.tenant(),c.agenda(),from,from.plusDays(1),0,100)).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        assertThatThrownBy(()->queries.appointments(professional::toString,c.tenant(),other.agenda(),from,from.plusDays(1),0,100)).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        assertThatThrownBy(()->queries.eligibility(professional::toString,c.tenant(),c.agenda(),other.patient(),c.offer(),from,null)).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        var empty=(Map<?,?>)queries.appointments(professional::toString,c.tenant(),c.agenda(),from.plusDays(1),from.plusDays(2),0,100);
        assertThat((List<?>)empty.get("items")).isEmpty();
    }
    @Test void patientManagersCanSelectProfessionalsWithoutAgendaAccess() {
        var descriptor=(Map<?,?>)workspace.workspace(careManager::toString,c.tenant());
        assertThat((List<?>)descriptor.get("agendas")).isEmpty();
        var professionals=(List<Map<String,Object>>)descriptor.get("professionals");
        assertThat(professionals).anySatisfy(p -> {
            assertThat(p.get("id")).isEqualTo(c.professionalEntity());
            assertThat(p.keySet()).isEqualTo(Set.of("id","nombre"));
        });
        delegateForTest(Set.of("agenda:read","booking:read"));
        var restricted=(Map<?,?>)workspace.workspace(secretary::toString,c.tenant());
        assertThat((List<?>)restricted.get("professionals")).isEmpty();
    }
    @Test void pagedWorkspaceListsKeepTheirOwnPermissionsAndSerializeOverHttp() throws Exception {
        for(String name:List.of("practices","coverages","notifications","tasks","admissions","plans","agreements")) {
            var result=(Map<?,?>)queries.list(careManager::toString,c.tenant(),name,null,0,250);
            assertThat(result.keySet()).isEqualTo(Set.of("items","total","offset","limit"));
        }
        for(String name:List.of("offers","hours","management-requests","rescheduling-cases")) {
            var result=(Map<?,?>)queries.list(professional::toString,c.tenant(),name,c.agenda(),0,250);
            assertThat(result.containsKey("items")).isTrue();
        }
        assertThatThrownBy(()->queries.list(secretary::toString,c.tenant(),"tasks",null,0,250)).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        assertThatThrownBy(()->queries.list(admin::toString,c.tenant(),"offers",c.agenda(),0,250)).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        var session=login("admin@demo.test");String uri="/api/v1/entities/"+c.tenant()+"/workspace";
        mvc.perform(get(uri+"/directory").session(session).param("limit","501")).andExpect(status().isBadRequest());
        mvc.perform(get(uri+"/lists/practices").session(session)).andExpect(status().isOk()).andExpect(jsonPath("$.total").value(2)).andExpect(jsonPath("$.items[0].nombre").exists());
        mvc.perform(get(uri+"/lists/arbitrary-table").session(session)).andExpect(status().isNotFound());
    }
    @Test void invalidCoverageAndHoursIntervalsAreRejectedBeforeWriting() {
        LocalDate date=at.atZone(ZoneId.of("America/Argentina/Buenos_Aires")).toLocalDate();
        UUID coverage=Db.uuid((Map<String,Object>)patients.coverage(careManager::toString,c.tenant(),new ar.com.salud.patient.PatientController.CoverageInput("Cobertura sintética")),"id");
        assertThatThrownBy(()->patients.affiliate(careManager::toString,c.tenant(),c.patient(),new ar.com.salud.patient.PatientController.AffiliationInput(coverage,null,"1",date,date.minusDays(1),"Evidencia sintética"))).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        assertThatThrownBy(()->organization.hours(professional::toString,c.tenant(),c.agenda(),new OrganizationController.HoursInput(1,LocalTime.of(12,0),LocalTime.of(11,0),date,null))).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        assertThatThrownBy(()->tenants.run(c.tenant(),patientAccount,()->booking.hold(c.tenant(),patientAccount,"bad-auth",new BookingController.HoldInput(c.patient(),c.offer(),at,null,UUID.randomUUID())))).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
    }

}
