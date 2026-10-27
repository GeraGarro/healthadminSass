package ar.com.salud.shared;

import java.util.UUID;
import java.util.function.Supplier;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.security.access.AccessDeniedException;

@Component
public class TenantTransactions {
    private final TransactionTemplate tx;
    private final Db db;
    public TenantTransactions(PlatformTransactionManager manager, Db db) {
        this.tx = new TransactionTemplate(manager); this.db = db;
    }
    public <T> T run(UUID tenant, UUID actor, Supplier<T> work) {
        return tx.execute(status -> {
            context(tenant,actor);
            if (!db.exists("select 1 from my_contexts(?) where id=?",actor,tenant))
                throw new AccessDeniedException("Contexto no autorizado");
            return work.get();
        });
    }
    /** Solo se invoca desde workers internos, sin ruta HTTP. */
    public <T> T system(UUID tenant, Supplier<T> work) {
        return tx.execute(status -> { context(tenant,null); return work.get(); });
    }
    private void context(UUID tenant,UUID actor) {
        db.jdbc.queryForObject("select set_config('app.tenant_id',?,true)",String.class,tenant.toString());
        db.jdbc.queryForObject("select set_config('app.actor_id',?,true)",String.class,actor==null?"":actor.toString());
    }
}
