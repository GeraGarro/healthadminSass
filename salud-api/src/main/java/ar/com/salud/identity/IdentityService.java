package ar.com.salud.identity;

import ar.com.salud.shared.Db;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.web.server.ResponseStatusException;

@Service
public class IdentityService {
    private final Db db;
    private final PasswordEncoder encoder;
    private final TransactionTemplate tx;
    private final String dummy;
    private final SecretBox secrets;
    private final String portal;
    public IdentityService(Db db,PasswordEncoder encoder,PlatformTransactionManager manager,SecretBox secrets,
            @Value("${app.portal-url:http://127.0.0.1:4387}") String portal) {
        this.db=db; this.encoder=encoder; tx=new TransactionTemplate(manager);
        dummy=encoder.encode("unusable-placeholder-password"); this.secrets=secrets; this.portal=portal;
    }
    public static String hash(String input) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(input.getBytes(StandardCharsets.UTF_8))); }
        catch(NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
    public static String token() {
        byte[] bytes=new byte[32]; new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
    public void throttle(String value,int limit) {
        Integer count=tx.execute(s -> db.jdbc.queryForObject("""
            insert into auth_throttle(key,window_start,attempts) values (?,now(),1)
            on conflict(key) do update set attempts=case when auth_throttle.window_start<now()-interval '15 minutes' then 1 else auth_throttle.attempts+1 end,
            window_start=case when auth_throttle.window_start<now()-interval '15 minutes' then now() else auth_throttle.window_start end returning attempts
            """,Integer.class,hash(value)));
        if(count!=null && count>limit) throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,"Espere antes de reintentar.");
    }
    public UUID authenticate(String email,String password,String remote) {
        throttle("login-ip:"+remote,80); throttle("login:"+email.toLowerCase(Locale.ROOT),15);
        var rows=db.list("select a.id,a.estado,c.hash_contrasena from cuenta a join credencial_local c on c.cuenta_id=a.id and c.revocada_en is null where lower(email_acceso)=?",email.toLowerCase(Locale.ROOT));
        var row=rows.isEmpty()?null:rows.getFirst();
        boolean valid=encoder.matches(password,row==null?dummy:(String)row.get("hash_contrasena"));
        if(!valid || row==null || !"ACTIVA".equals(row.get("estado")) || db.exists("select 1 from cuenta where id=? and cambio_clave_pendiente and clave_provisoria_vence<=now()",row.get("id")))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Credenciales inválidas.");
        return Db.uuid(row,"id");
    }
    public UUID invite(String name,String email) {
        UUID id=db.id("insert into cuenta(nombre,email_acceso,estado,creada_en) values (?,lower(?),'INVITADA',now()) returning id",name,email);
        issue(id,email,"ACTIVATE"); return id;
    }
    public Map<String,Object> provisional(String name,String email) {
        if(db.exists("select 1 from cuenta where lower(email_acceso)=lower(?)",email))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"La cuenta ya existe. El profesional debe solicitar su vínculo desde su cuenta; no se crea una identidad duplicada.");
        String password=token().substring(0,20);
        UUID id=db.id("insert into cuenta(nombre,email_acceso,estado,creada_en,cambio_clave_pendiente,clave_provisoria_vence) values (?,lower(?),'ACTIVA',now(),true,now()+interval '48 hours') returning id",name,email);
        db.update("insert into credencial_local(cuenta_id,hash_contrasena,algoritmo_version,actualizada_en) values (?,?,'bcrypt',now())",id,encoder.encode(password));
        return Map.of("id",id,"email",email,"temporaryPassword",password);
    }
    public void changeProvisional(UUID actor,String password) {
        tx.executeWithoutResult(s -> {
            db.one("select id from cuenta where id=? and cambio_clave_pendiente=true and clave_provisoria_vence>now() for update",actor);
            var current=db.one("select hash_contrasena from credencial_local where cuenta_id=? and revocada_en is null",actor);
            if(encoder.matches(password,(String)current.get("hash_contrasena")))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Elegí una contraseña diferente de la provisoria.");
            db.update("update credencial_local set revocada_en=now() where cuenta_id=? and revocada_en is null",actor);
            db.update("insert into credencial_local(cuenta_id,hash_contrasena,algoritmo_version,actualizada_en) values (?,?,'bcrypt',now())",actor,encoder.encode(password));
            db.update("update cuenta set cambio_clave_pendiente=false,clave_provisoria_vence=null where id=?",actor);
            db.update("update sesion set revocada_en=now() where cuenta_id=? and revocada_en is null",actor);
        });
    }
    public void issue(UUID account,String email,String purpose) {
        String raw=token();
        db.update("update token_identidad set revocado_en=now() where cuenta_id=? and proposito=? and usado_en is null and revocado_en is null",account,purpose);
        UUID id=db.id("insert into token_identidad(cuenta_id,destinatario,huella,proposito,vence_en) values (?,?,?,?,now()+interval '30 minutes') returning id",account,email,hash(raw),purpose);
        db.update("insert into identity_delivery(token_id,destination,encrypted_link,state,due_at,attempts) values (?,?,?,'PENDING',now(),0)",
            id,email,secrets.encrypt(portal+"/access/"+purpose.toLowerCase(Locale.ROOT)+"?token="+raw));
    }
    public void recover(String email,String remote) {
        throttle("recover-ip:"+remote,30); throttle("recover:"+email.toLowerCase(Locale.ROOT),3);
        tx.executeWithoutResult(s -> {
            var rows=db.list("select id,email_acceso from cuenta where lower(email_acceso)=? and estado='ACTIVA' and email_verificado_en is not null",email.toLowerCase(Locale.ROOT));
            if(!rows.isEmpty()) issue(Db.uuid(rows.getFirst(),"id"),email,"RESET");
        });
    }
    public void consume(String raw,String password) {
        tx.executeWithoutResult(s -> {
            var t=db.one("select * from token_identidad where huella=? and usado_en is null and revocado_en is null and vence_en>now() for update",hash(raw));
            UUID account=Db.uuid(t,"cuenta_id");
            db.update("update credencial_local set revocada_en=now() where cuenta_id=? and revocada_en is null",account);
            db.update("insert into credencial_local(cuenta_id,hash_contrasena,algoritmo_version,actualizada_en) values (?,?,'bcrypt',now())",account,encoder.encode(password));
            db.update("update token_identidad set usado_en=now() where id=?",t.get("id"));
            if("ACTIVATE".equals(t.get("proposito"))) {
                db.update("update cuenta set estado='ACTIVA',email_verificado_en=now() where id=? and estado='INVITADA'",account);
                // La verificación del enlace solo activa vínculos ya aprobados para esa cuenta.
                db.jdbc.queryForObject("select activate_approved_access(?)",Integer.class,account);
            }
            db.update("update sesion set revocada_en=now() where cuenta_id=? and revocada_en is null",account);
        });
    }
}
