package ar.com.salud.communication;

import ar.com.salud.shared.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.*;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class DeliveryWebhookController {
    private final Db db;private final TenantTransactions tx;private final ObjectMapper json;private final String secret;
    public DeliveryWebhookController(Db db,TenantTransactions tx,ObjectMapper json,@Value("${WEBHOOK_SECRET:}") String secret){this.db=db;this.tx=tx;this.json=json;this.secret=secret;}
    public record Event(UUID tenantId,UUID channelId,UUID messageId,String eventId,String status,Instant occurredAt) {}
    @PostMapping("/api/v1/delivery-events") public void event(@RequestHeader("X-Delivery-Timestamp") String timestamp,
        @RequestHeader("X-Delivery-Signature") String signature,@RequestBody String raw) {
        try {
            long seconds=Long.parseLong(timestamp);
            if(secret.length()<32 || Math.abs(Instant.now().getEpochSecond()-seconds)>300 || raw.length()>16384) reject();
            Mac mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8),"HmacSHA256"));
            String expected=HexFormat.of().formatHex(mac.doFinal((timestamp+"."+raw).getBytes(StandardCharsets.UTF_8)));
            if(!MessageDigest.isEqual(expected.getBytes(StandardCharsets.US_ASCII),signature.getBytes(StandardCharsets.US_ASCII))) reject();
        }catch(ResponseStatusException e){throw e;}catch(Exception e){reject();}
        Event event;
        try {event=json.readValue(raw,Event.class);}catch(Exception e){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Evento inválido.");}
        if(event.tenantId()==null||event.channelId()==null||event.messageId()==null||event.eventId()==null||event.eventId().length()>200||event.occurredAt()==null||!Set.of("DELIVERED","FAILED").contains(event.status()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Evento inválido.");
        tx.system(event.tenantId(),() -> {
            var attempt=db.one("select i.id from intento_envio i join aviso_externo a on a.id=i.aviso_id and a.tenant_id=i.tenant_id join canal_entidad c on c.id=a.canal_id and c.tenant_id=a.tenant_id where a.id=? and c.id=? and c.estado='ACTIVO' order by i.numero desc limit 1",event.messageId(),event.channelId());
            int inserted=db.update("insert into evento_proveedor(tenant_id,canal_id,intento_id,evento_externo,tipo,ocurrido_en,recibido_en,validacion_ref) values (?,?,?,?,?,?,now(),'HMAC-SHA256') on conflict(tenant_id,canal_id,evento_externo) do nothing",event.tenantId(),event.channelId(),attempt.get("id"),event.eventId(),event.status(),event.occurredAt());
            if(inserted==1) {
                String state=event.status().equals("DELIVERED")?"ENTREGADO":"FALLIDO";
                // Entrega prevalece sobre un fallo tardío. Nunca confirma asistencia.
                db.update("update aviso_externo set estado=? where id=? and estado<>'ENTREGADO'",state,event.messageId());
                db.update("update intento_envio set estado=?,entregado_en=case when ?='ENTREGADO' then ? else entregado_en end where id=? and estado<>'ENTREGADO'",state,state,event.occurredAt(),attempt.get("id"));
                db.update("update turno_afectado set estado_aviso=? where id=(select t.turno_afectado_id from tarea_persistida t join aviso_externo a on a.tarea_id=t.id and a.tenant_id=t.tenant_id where a.id=?) and estado_aviso<>'ENTREGADO'",state,event.messageId());
            }
            return null;
        });
    }
    private static void reject(){throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Firma de callback inválida.");}
}
