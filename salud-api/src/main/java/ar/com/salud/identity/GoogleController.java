package ar.com.salud.identity;

import ar.com.salud.shared.Db;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.security.Principal;
import java.time.Instant;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/** Google verifica identidad; nunca crea admisión, fusiona cuentas ni concede roles. */
@RestController @RequestMapping("/api/v1/auth/google")
public class GoogleController {
    private final Db db;private final IdentityService identity;private final AuthController sessions;private final JwtDecoder decoder;private final String clientId;
    public GoogleController(Db db,IdentityService identity,AuthController sessions,@Value("${GOOGLE_CLIENT_ID:}") String clientId) {
        this.db=db;this.identity=identity;this.sessions=sessions;this.clientId=clientId;
        if(clientId.isBlank())decoder=null;
        else {var nimbus=NimbusJwtDecoder.withJwkSetUri("https://www.googleapis.com/oauth2/v3/certs").build();nimbus.setJwtValidator(JwtValidators.createDefaultWithIssuer("https://accounts.google.com"));decoder=nimbus;}
    }
    public record Input(@NotBlank @Size(max=12000) String idToken,@Size(max=128) String password) {}
    @GetMapping("/nonce") public Object nonce(HttpServletRequest request) {
        configured();String nonce=IdentityService.token();var session=request.getSession();
        session.setAttribute("googleNonce",nonce);session.setAttribute("googleNonceAt",Instant.now().getEpochSecond());
        return Map.of("nonce",nonce,"clientId",clientId);
    }
    @PostMapping public Object login(@Valid @RequestBody Input body,HttpServletRequest request,HttpServletResponse response) {
        identity.throttle("google-ip:"+request.getRemoteAddr(),30);String subject=subject(body.idToken(),request);
        var rows=db.list("select c.id from identidad_externa i join cuenta c on c.id=i.cuenta_id where i.emisor='https://accounts.google.com' and i.sujeto=? and i.revocada_en is null and c.estado='ACTIVA'",subject);
        if(rows.isEmpty())throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Vincule Google desde su cuenta verificada mediante correo.");
        return sessions.establishSession(Db.uuid(rows.getFirst(),"id"),request,response);
    }
    @PostMapping("/link") public void link(Principal principal,@Valid @RequestBody Input body,HttpServletRequest request) {
        UUID actor=UUID.fromString(principal.getName());
        String email=(String)db.one("select email_acceso from cuenta where id=?",actor).get("email_acceso");
        if(body.password()==null)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Verifique su contraseña actual.");
        identity.authenticate(email,body.password(),request.getRemoteAddr());String subject=subject(body.idToken(),request);
        db.update("insert into identidad_externa(cuenta_id,emisor,sujeto,vinculada_en) values (?,'https://accounts.google.com',?,now())",actor,subject);
    }
    private String subject(String idToken,HttpServletRequest request) {
        configured();var session=request.getSession(false);
        Object nonce=session==null?null:session.getAttribute("googleNonce"),at=session==null?null:session.getAttribute("googleNonceAt");
        if(session!=null){session.removeAttribute("googleNonce");session.removeAttribute("googleNonceAt");}
        try {
            Jwt jwt=decoder.decode(idToken);
            if(nonce==null||at==null||Instant.now().getEpochSecond()-(Long)at>300||!nonce.equals(jwt.getClaimAsString("nonce"))||!jwt.getAudience().contains(clientId)||jwt.getSubject()==null||jwt.getAudience().size()>1 && !clientId.equals(jwt.getClaimAsString("azp")))
                throw new IllegalArgumentException();
            return jwt.getSubject();
        }catch(Exception e){throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Identidad Google inválida.");}
    }
    private void configured(){if(decoder==null)throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Google no está configurado en este entorno.");}
}
