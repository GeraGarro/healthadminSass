package ar.com.salud.identity;

import ar.com.salud.shared.Db;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MfaService {
    private final Db db;private final SecretBox secrets;private final IdentityService identity;private final TransactionTemplate tx;
    public MfaService(Db db,SecretBox secrets,IdentityService identity,PlatformTransactionManager manager){this.db=db;this.secrets=secrets;this.identity=identity;this.tx=new TransactionTemplate(manager);}
    public Map<String,String> enroll(UUID actor,String password,String remote) {
        var account=db.one("select email_acceso from cuenta where id=?",actor);
        identity.authenticate((String)account.get("email_acceso"),password,remote);
        return tx.execute(s -> {
            db.one("select id from cuenta where id=? for update",actor);
            if(db.exists("select 1 from factor_mfa where cuenta_id=? and revocado_en is null and verificado_en is not null",actor)) throw new ResponseStatusException(HttpStatus.CONFLICT,"Factor ya configurado.");
            db.update("update factor_mfa set revocado_en=now() where cuenta_id=? and revocado_en is null",actor);
            byte[] key=new byte[20];new SecureRandom().nextBytes(key);
            db.update("insert into factor_mfa(cuenta_id,tipo,referencia_secreta) values (?,'TOTP',?)",actor,secrets.encrypt(Base64.getEncoder().encodeToString(key)));
            return Map.of("secret",base32(key),"uri","otpauth://totp/Salud:"+actor+"?secret="+base32(key)+"&issuer=Salud&algorithm=SHA1&digits=6&period=30");
        });
    }
    public void verify(UUID actor,String code,String sessionId) {
        identity.throttle("mfa:"+actor,10);
        tx.executeWithoutResult(s -> {
            var factor=db.one("select * from factor_mfa where cuenta_id=? and tipo='TOTP' and revocado_en is null for update",actor);
            byte[] key=Base64.getDecoder().decode(secrets.decrypt((String)factor.get("referencia_secreta")));
            long current=Instant.now().getEpochSecond()/30,last=((Number)factor.get("ultimo_contador")).longValue(),matched=-1;
            for(long i=current-1;i<=current+1;i++) if(i>last && totp(key,i,6).equals(code)) matched=i;
            if(matched<0) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Código inválido o ya utilizado.");
            db.update("update factor_mfa set ultimo_contador=?,verificado_en=coalesce(verificado_en,now()) where id=?",matched,factor.get("id"));
            db.update("update sesion set mfa_verificada_en=now() where cuenta_id=? and huella_sesion=? and revocada_en is null",actor,IdentityService.hash(sessionId));
        });
    }
    public static String totp(byte[] key,long counter,int digits) {
        try {
            Mac mac=Mac.getInstance("HmacSHA1");mac.init(new SecretKeySpec(key,"HmacSHA1"));byte[] hash=mac.doFinal(ByteBuffer.allocate(8).putLong(counter).array());
            int offset=hash[hash.length-1]&15;
            int value=((hash[offset]&127)<<24)|((hash[offset+1]&255)<<16)|((hash[offset+2]&255)<<8)|(hash[offset+3]&255);
            return String.format(Locale.ROOT,"%0"+digits+"d",value%(int)Math.pow(10,digits));
        }catch(Exception e){throw new IllegalStateException(e);}
    }
    private static String base32(byte[] bytes) {
        String chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";StringBuilder out=new StringBuilder();int bits=0,buffer=0;
        for(byte b:bytes){buffer=(buffer<<8)|(b&255);bits+=8;while(bits>=5){bits-=5;out.append(chars.charAt((buffer>>bits)&31));}}
        if(bits>0)out.append(chars.charAt((buffer<<(5-bits))&31));return out.toString();
    }
}
