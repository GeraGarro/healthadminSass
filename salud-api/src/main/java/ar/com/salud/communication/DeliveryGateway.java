package ar.com.salud.communication;

import java.time.Duration;
import java.net.http.HttpClient;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/** Contrato de gateway propio: ver README. La clave debe deduplicarse en el gateway. */
@Component
public class DeliveryGateway {
    private final RestClient client; private final String url; private final String token; private final boolean simulated;
    public DeliveryGateway(@Value("${app.delivery.url:}") String url,@Value("${app.delivery.token:}") String token,
        @Value("${app.delivery.simulated:false}") boolean simulated) {
        this.url=url;this.token=token;this.simulated=simulated;
        var factory=new JdkClientHttpRequestFactory(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
        factory.setReadTimeout(Duration.ofSeconds(15));client=RestClient.builder().requestFactory(factory).build();
        if(!simulated && (url.isBlank() || token.isBlank() || !url.startsWith("https://")))
            throw new IllegalArgumentException("Configurar DELIVERY_URL HTTPS y DELIVERY_TOKEN para envíos reales");
    }
    public boolean simulated() { return simulated; }
    public void send(String key,Map<String,Object> payload) {
        if(simulated) return;
        client.post().uri(url).header("Authorization","Bearer "+token).header("Idempotency-Key",key)
            .body(payload).retrieve().toBodilessEntity();
    }
}
