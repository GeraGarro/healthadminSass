package ar.com.salud.audit;

import ar.com.salud.shared.Db;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.UUID;
import org.springframework.web.filter.OncePerRequestFilter;

/** Registra rechazos después del rollback del caso de uso; nunca almacena cuerpos ni credenciales. */
public class RequestAuditFilter extends OncePerRequestFilter {
    private final Db db;
    public RequestAuditFilter(Db db){this.db=db;}
    @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException {
        String correlation=UUID.randomUUID().toString();req.setAttribute("correlationId",correlation);res.setHeader("X-Correlation-ID",correlation);
        try{chain.doFilter(req,res);}finally{
            if(res.getStatus()==401||res.getStatus()==403) {
                UUID actor=null;
                try{if(req.getUserPrincipal()!=null)actor=UUID.fromString(req.getUserPrincipal().getName());}catch(IllegalArgumentException ignored){}
                try{db.update("insert into auditoria_global(actor_id,servicio_actor,accion,ocurrido_en,resultado,contexto_minimo) values (?,'http','HTTP_DENIED',now(),'DENIED',jsonb_build_object('status',?::int,'correlation',?::text))",actor,res.getStatus(),correlation);}
                catch(org.springframework.dao.DataAccessException e){logger.warn("No se pudo persistir el rechazo HTTP: "+correlation);}
            }
        }
    }
}
