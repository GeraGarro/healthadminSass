package ar.com.salud.patient;

import ar.com.salud.shared.Db;
import java.nio.charset.StandardCharsets;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Global document identity contains no names, contacts, institutional membership or care data. */
@Service
public class PatientIdentityRegistry {
    private final Db db; private final byte[] key;
    public PatientIdentityRegistry(Db db,@Value("${app.encryption-key}") String secret){this.db=db;this.key=Base64.getDecoder().decode(secret);}
    public static String document(String value){return value==null?"":value.replaceAll("[^0-9]","");}
    public UUID identity(String document){
        try {
            Mac mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(key,"HmacSHA256"));
            String fingerprint=HexFormat.of().formatHex(mac.doFinal(("AR:DNI:"+document).getBytes(StandardCharsets.UTF_8)));
            var inserted=db.list("insert into identidad_paciente_global(huella_documental) values (?) on conflict(huella_documental) do nothing returning id",fingerprint);
            return inserted.isEmpty()?db.id("select id from identidad_paciente_global where huella_documental=?",fingerprint):Db.uuid(inserted.getFirst(),"id");
        }catch(java.security.GeneralSecurityException e){throw new IllegalStateException(e);}
    }
    public void lock(UUID tenant,String document){db.jdbc.queryForObject("select pg_advisory_xact_lock(hashtextextended(?,0))",Object.class,"patient-document:"+tenant+":"+document);}
    public List<Map<String,Object>> matches(String document){return db.list("select id,nombres,apellidos,identidad_global_id from paciente where regexp_replace(coalesce(documento_declarado,''),'[^0-9]','','g')=? order by id",document);}
    public UUID create(UUID tenant,String first,String last,String document,java.time.LocalDate birth,String address){
        String normalized=document(document); UUID global=null;
        if(!normalized.isEmpty()){
            lock(tenant,normalized);
            if(!matches(normalized).isEmpty())throw new ResponseStatusException(HttpStatus.CONFLICT,"Ya existe un paciente con ese DNI. Buscalo y vinculalo al profesional para evitar otro registro.");
            global=identity(normalized);
        }
        return db.id("insert into paciente(tenant_id,nombres,apellidos,tipo_documento,documento_declarado,nacimiento,domicilio,estado,estado_datos_cobertura,identidad_global_id) values (?,?,?,'DNI',?,?,?,'ACTIVO','PENDIENTE',?) returning id",tenant,first.trim(),last.trim(),document,birth,address,global);
    }
    public UUID link(UUID tenant,UUID patient,UUID professional){
        var pe=db.one("select profesional_id from profesional_entidad where id=? and estado='ACTIVO'",professional);
        db.one("select id from paciente where id=? and estado='ACTIVO'",patient);
        db.jdbc.queryForObject("select pg_advisory_xact_lock(hashtextextended(?,0))",Object.class,tenant+":"+pe.get("profesional_id"));
        var existing=db.list("select id from paciente_profesional where profesional_id=? and paciente_id=?",pe.get("profesional_id"),patient);
        if(!existing.isEmpty()){db.update("update paciente_profesional set estado='ACTIVO' where id=?",existing.getFirst().get("id"));return Db.uuid(existing.getFirst(),"id");}
        Integer number=db.jdbc.queryForObject("insert into contador_paciente(tenant_id,profesional_id,profesional_entidad_id,ultimo_confirmado,version) values (?,?,?,1,1) on conflict(tenant_id,profesional_id) do update set ultimo_confirmado=contador_paciente.ultimo_confirmado+1,version=contador_paciente.version+1 returning ultimo_confirmado",Integer.class,tenant,pe.get("profesional_id"),professional);
        return db.id("insert into paciente_profesional(tenant_id,profesional_id,profesional_entidad_id,paciente_id,numero_visible,estado,alta_en) values (?,?,?,?,?,'ACTIVO',now()) returning id",tenant,pe.get("profesional_id"),professional,patient,number);
    }
}
