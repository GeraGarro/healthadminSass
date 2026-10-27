package ar.com.salud.config;

import ar.com.salud.shared.Db;
import ar.com.salud.identity.SecretBox;
import ar.com.salud.organization.Authorization;
import java.security.Principal;
import java.util.*;
import org.springframework.context.annotation.Profile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

@RestController @Profile("local") @RequestMapping("/api/v1/dev")
public class LocalController {
    @Value("${DEMO_ENABLED:false}") private boolean demo;
    @Value("${app.delivery.simulated:false}") private boolean simulated;
    private final Db db;private final Authorization auth;private final SecretBox secrets;
    public LocalController(Db db,Authorization auth,SecretBox secrets) {this.db=db;this.auth=auth;this.secrets=secrets;}
    @GetMapping("/status") public Object status(Principal p) {
        auth.platform(UUID.fromString(p.getName()));
        return Map.of("environment","local","demoEnabled",demo,"simulatedDelivery",simulated);
    }
    @GetMapping("/mailbox") public Object mailbox(Principal p) {
        auth.platform(UUID.fromString(p.getName()));
        return db.list("select id,destination,encrypted_link,state from identity_delivery where encrypted_link is not null order by id desc limit 20").stream().map(r -> Map.of("id",r.get("id"),"destination",r.get("destination"),"link",secrets.decrypt((String)r.get("encrypted_link")),"state",r.get("state"))).toList();
    }
}
