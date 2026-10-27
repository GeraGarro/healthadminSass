package ar.com.salud.identity;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class SecretBox {
    private final byte[] key;
    public SecretBox(@Value("${app.encryption-key}") String encoded) {
        key=Base64.getDecoder().decode(encoded);
        if(key.length!=32) throw new IllegalArgumentException("APP_ENCRYPTION_KEY debe contener 32 bytes en base64");
    }
    public String encrypt(String value) {
        try {
            byte[] iv=new byte[12]; new SecureRandom().nextBytes(iv);
            Cipher c=Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.ENCRYPT_MODE,new SecretKeySpec(key,"AES"),new GCMParameterSpec(128,iv));
            return Base64.getEncoder().encodeToString(iv)+"."+Base64.getEncoder().encodeToString(c.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch(Exception e) { throw new IllegalStateException("No se pudo cifrar secreto",e); }
    }
    public String decrypt(String value) {
        try {
            String[] parts=value.split("\\.");
            Cipher c=Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE,new SecretKeySpec(key,"AES"),new GCMParameterSpec(128,Base64.getDecoder().decode(parts[0])));
            return new String(c.doFinal(Base64.getDecoder().decode(parts[1])),StandardCharsets.UTF_8);
        } catch(Exception e) { throw new IllegalStateException("No se pudo descifrar secreto",e); }
    }
}
