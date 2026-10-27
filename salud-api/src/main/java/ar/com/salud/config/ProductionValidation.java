package ar.com.salud.config;
import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component @Profile("production")
public class ProductionValidation implements ApplicationRunner {
    private final Environment env;private final String portal;private final String webhook;
    public ProductionValidation(Environment env,@Value("${app.portal-url}") String portal,@Value("${WEBHOOK_SECRET:}") String webhook){this.env=env;this.portal=portal;this.webhook=webhook;}
    @Override public void run(ApplicationArguments args){
        if(Arrays.asList(env.getActiveProfiles()).contains("local")||env.getProperty("DEMO_ENABLED",Boolean.class,false)||!portal.startsWith("https://")||webhook.length()<32)
            throw new IllegalArgumentException("Producción requiere HTTPS, WEBHOOK_SECRET de al menos 32 caracteres y datos demo deshabilitados");
    }
}
