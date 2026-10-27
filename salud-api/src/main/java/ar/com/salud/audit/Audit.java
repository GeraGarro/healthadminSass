package ar.com.salud.audit;

import java.util.UUID;
import ar.com.salud.shared.Db;
import org.springframework.stereotype.Component;

@Component
public class Audit {
    private final Db db;
    public Audit(Db db) { this.db=db; }
    public void record(UUID tenant,UUID actor,String action,String resource,Object id) {
        var attributes=org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
        Object correlation=attributes==null?null:attributes.getAttribute("correlationId",0);
        db.update("insert into auditoria_entidad(tenant_id,actor_id,servicio_actor,accion,recurso_tipo,recurso_ref,ocurrido_en,resultado,cambios_minimos,correlacion) values (?,?,?,?,?,?,now(),'OK','{}',?)",
            tenant,actor,actor==null?"worker":null,action,resource,id.toString(),correlation==null?UUID.randomUUID().toString():correlation.toString());
    }
}
