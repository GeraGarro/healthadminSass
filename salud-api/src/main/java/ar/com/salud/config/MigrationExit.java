package ar.com.salud.config;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** El job de migración termina después de validar esquema y provisionar la cuenta inicial. */
@Component @Profile("bootstrap")
public class MigrationExit {
    @EventListener public void ready(ApplicationReadyEvent event) { event.getApplicationContext().close(); }
}
