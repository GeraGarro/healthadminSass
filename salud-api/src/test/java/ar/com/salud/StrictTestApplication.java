package ar.com.salud;

import ar.com.salud.identity.SecretBox;
import ar.com.salud.shared.Db;
import java.nio.file.*;
import java.util.*;
import org.springframework.boot.SpringApplication;
import org.springframework.jdbc.core.JdbcTemplate;
import org.flywaydb.core.Flyway;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.MountableFile;

/** Test classpath only. Always creates its own disposable DB; accepts no external database URL. */
public final class StrictTestApplication {
    public static final String PASSWORD="integration-test-only-password";
    public static final String TOTP_SECRET="JBSWY3DPEHPK3PXP";
    public static void main(String[] args) throws Exception {
        if(args.length!=0)throw new IllegalArgumentException("La fixture no acepta configuración de una base externa.");
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        var postgres=new PostgreSQLContainer("postgres:18.6").withDatabaseName("salud")
            .withUsername("postgres").withPassword("test-admin-only")
            .withEnv("APP_DB_PASSWORD","test-runtime-only").withEnv("MIGRATION_DB_PASSWORD","test-migration-only")
            .withCopyFileToContainer(MountableFile.forHostPath("docker/postgres/001-roles.sql"),"/docker-entrypoint-initdb.d/001-roles.sql");
        postgres.start();
        Runtime.getRuntime().addShutdownHook(new Thread(postgres::stop));
        var app=SpringApplication.run(SaludApiApplication.class,
            "--spring.profiles.active=local","--server.address=127.0.0.1","--server.port=18080",
            "--spring.datasource.url="+postgres.getJdbcUrl(),"--spring.datasource.username=salud_app","--spring.datasource.password=test-runtime-only",
            "--spring.flyway.url="+postgres.getJdbcUrl(),"--spring.flyway.user=salud_migrator","--spring.flyway.password=test-migration-only",
            "--app.encryption-key=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=","--app.mfa.required-staff=true",
            "--app.delivery.simulated=true","--app.worker.enabled=false","--app.portal-url=http://127.0.0.1:4390","--app.strict-fixture=true",
            "--BOOTSTRAP_EMAIL=admin@demo.test","--BOOTSTRAP_PASSWORD="+PASSWORD,"--DEMO_ENABLED=true");
        var db=new Db(new JdbcTemplate(app.getBean(Flyway.class).getConfiguration().getDataSource()));
        var secrets=app.getBean(SecretBox.class);
        // Public, synthetic seed for this disposable fixture, never a production credential.
        byte[] key=HexFormat.of().parseHex("48656c6c6f21deadbeef");
        for(String email:List.of("admin@demo.test","profesional@demo.test","secretaria@demo.test")) {
            var id=db.id("select id from cuenta where email_acceso=?",email);
            db.update("insert into factor_mfa(cuenta_id,tipo,referencia_secreta,verificado_en,ultimo_contador) values (?,'TOTP',?,now(),-1)",id,secrets.encrypt(Base64.getEncoder().encodeToString(key)));
        }
        Files.createDirectories(Path.of("../tmp"));
        Files.writeString(Path.of("../tmp/strict-fixture.ready"),"http://127.0.0.1:18080\nMFA obligatorio; proveedores simulados; PostgreSQL descartable.\n");
        System.out.println("STRICT_FIXTURE_READY http://127.0.0.1:18080 — frontend http://127.0.0.1:4390");
    }
    @org.springframework.context.annotation.Configuration(proxyBeanMethods=false)
    @org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name="app.strict-fixture",havingValue="true")
    static class FixtureMarker {
        @org.springframework.context.annotation.Bean
        jakarta.servlet.Filter fixtureHeader(){return (request,response,chain)->{
            ((jakarta.servlet.http.HttpServletResponse)response).setHeader("X-Salud-Test-Fixture","disposable-postgres-mfa");
            chain.doFilter(request,response);
        };}
    }
}
