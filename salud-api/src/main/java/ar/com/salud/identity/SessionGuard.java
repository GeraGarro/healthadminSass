package ar.com.salud.identity;

import ar.com.salud.shared.Db;
import ar.com.salud.shared.error.SecurityProblemWriter;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.UUID;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

/** Comprobación DB en cada petición: recuperar contraseña revoca todas las sesiones. */
public class SessionGuard extends OncePerRequestFilter {
    private final Db db;
    private final boolean requireStaffMfa;
    public SessionGuard(Db db,boolean requireStaffMfa) { this.db=db;this.requireStaffMfa=requireStaffMfa; }
    @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain) throws ServletException,IOException {
        var auth=SecurityContextHolder.getContext().getAuthentication();
        boolean authenticated=auth!=null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken);
        if(authenticated && req.getSession(false)!=null &&
            !db.exists("select 1 from sesion s join cuenta c on c.id=s.cuenta_id where s.huella_sesion=? and s.revocada_en is null and s.vence_en>now() and c.estado='ACTIVA'",IdentityService.hash(req.getSession(false).getId()))) {
            req.getSession(false).invalidate(); SecurityContextHolder.clearContext();
            SecurityProblemWriter.write(res,401,"Unauthorized","Sesión vencida o revocada."); return;
        }
        if(authenticated && req.getSession(false)!=null && req.getRequestURI().startsWith("/api/v1/") && !req.getRequestURI().startsWith("/api/v1/auth/")) {
            UUID actor=UUID.fromString(auth.getName());
            if(db.exists("select 1 from cuenta where id=? and cambio_clave_pendiente",actor)) {
                SecurityProblemWriter.write(res,403,"Forbidden","Cambio de contraseña provisoria requerido.");return;
            }
            boolean enrolled=db.exists("select 1 from factor_mfa where cuenta_id=? and verificado_en is not null and revocado_en is null",actor);
            boolean required=enrolled || requireStaffMfa && Boolean.TRUE.equals(db.jdbc.queryForObject("select requires_mfa(?)",Boolean.class,actor));
            if(required && !db.exists("select 1 from sesion where huella_sesion=? and mfa_verificada_en is not null and revocada_en is null",IdentityService.hash(req.getSession(false).getId()))) {
                SecurityProblemWriter.write(res,403,"Forbidden","Verificación MFA requerida.");return;
            }
        }
        chain.doFilter(req,res);
    }
}
