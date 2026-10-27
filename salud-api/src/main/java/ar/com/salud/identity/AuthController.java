package ar.com.salud.identity;

import ar.com.salud.shared.Db;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.security.Principal;
import java.util.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final IdentityService identity;
    private final Db db;
    public AuthController(IdentityService identity,Db db) { this.identity=identity; this.db=db; }
    public record Login(@NotBlank @Email @Size(max=254) String email,@NotBlank @Size(max=128) String password) {}
    public record Recovery(@NotBlank @Email @Size(max=254) String email) {}
    public record Reset(@NotBlank @Size(max=100) String token,@Size(min=12,max=72) @NotBlank String password) {}
    public record NewPassword(@NotBlank @Size(min=12,max=72) String password) {}
    @PostMapping("/provisional-password") public Map<String,Object> provisionalPassword(Principal actor,@Valid @RequestBody NewPassword body,HttpServletRequest req,HttpServletResponse res) {
        UUID id=UUID.fromString(actor.getName()); identity.changeProvisional(id,body.password()); return establishSession(id,req,res);
    }
    @GetMapping("/csrf") public Map<String,String> csrf(CsrfToken token) {
        return Map.of("token",token.getToken(),"headerName",token.getHeaderName());
    }
    @PostMapping("/login") public Map<String,Object> login(@Valid @RequestBody Login body,HttpServletRequest req,HttpServletResponse res) {
        UUID actor=identity.authenticate(body.email(),body.password(),req.getRemoteAddr());
        return establishSession(actor,req,res);
    }
    Map<String,Object> establishSession(UUID actor,HttpServletRequest req,HttpServletResponse res) {
        if(req.getSession(false)!=null) req.getSession(false).invalidate();
        var session=req.getSession(true);
        db.update("insert into sesion(cuenta_id,huella_sesion,iniciada_en,vence_en) values (?,?,now(),now()+interval '8 hours')",actor,IdentityService.hash(session.getId()));
        var context=SecurityContextHolder.createEmptyContext();
        context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(actor.toString(),null,List.of()));
        SecurityContextHolder.setContext(context);
        new HttpSessionSecurityContextRepository().saveContext(context,req,res);
        new HttpSessionCsrfTokenRepository().saveToken(null,req,res);
        return Map.of("accountId",actor);
    }
    @PostMapping("/logout") public void logout(HttpServletRequest req) {
        if(req.getSession(false)!=null) {
            db.update("update sesion set revocada_en=now() where huella_sesion=?",IdentityService.hash(req.getSession(false).getId()));
            req.getSession(false).invalidate();
        }
        SecurityContextHolder.clearContext();
    }
    @GetMapping("/me") public Map<String,Object> me(Principal actor) {
        UUID id=UUID.fromString(actor.getName());
        return Map.of("account",db.one("select id,nombre,email_acceso,cambio_clave_pendiente from cuenta where id=?",id),
            "entities",db.list("select * from my_contexts(?)",id));
    }
    @PostMapping("/recover") public Map<String,String> recover(@Valid @RequestBody Recovery body,HttpServletRequest req) {
        identity.recover(body.email(),req.getRemoteAddr());
        return Map.of("message","Si corresponde, recibirá instrucciones en su correo.");
    }
    @PostMapping("/reset") public void reset(@Valid @RequestBody Reset body,HttpServletRequest req) {
        identity.throttle("reset-ip:"+req.getRemoteAddr(),30);
        identity.consume(body.token(),body.password());
    }
}
