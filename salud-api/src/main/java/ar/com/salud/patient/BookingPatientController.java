package ar.com.salud.patient;

import ar.com.salud.audit.Audit;
import ar.com.salud.organization.Authorization;
import ar.com.salud.shared.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.security.Principal;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController @RequestMapping("/api/v1/entities/{tenant}/agendas/{agenda}")
public class BookingPatientController {
    private final Db db;private final TenantTransactions tx;private final Authorization auth;private final PatientIdentityRegistry registry;private final Audit audit;
    public BookingPatientController(Db db,TenantTransactions tx,Authorization auth,PatientIdentityRegistry registry,Audit audit){this.db=db;this.tx=tx;this.auth=auth;this.registry=registry;this.audit=audit;}
    public record Registration(@NotBlank @Size(max=100) String firstName,@NotBlank @Size(max=100) String lastName,
        @NotBlank @Pattern(regexp="[0-9 .-]{6,15}") String document,@NotBlank @Email @Size(max=254) String email,
        @NotBlank @Size(max=30) String phone,@NotBlank @Size(max=300) String address,boolean contactConsent){}
    public record Existing(@NotBlank @Pattern(regexp="[0-9 .-]{6,15}") String document){}
    private UUID actor(Principal p){return UUID.fromString(p.getName());}
    private String document(String value){String dni=PatientIdentityRegistry.document(value);if(!dni.matches("[0-9]{6,12}"))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Ingresá un DNI válido.");return dni;}
    @GetMapping("/patient-match") public Object match(Principal p,@PathVariable UUID tenant,@PathVariable UUID agenda,@RequestParam @Pattern(regexp="[0-9 .-]{6,15}") String document){
        return tx.run(tenant,actor(p),()->{auth.requireAgenda(actor(p),agenda,"booking:create");String dni=document(document);
            // Exact-document lookup returns only local registration facts, never another tenant's data.
            return db.list("select p.id,p.nombres,p.apellidos,exists(select 1 from paciente_profesional pp join agenda a on a.profesional_entidad_id=pp.profesional_entidad_id and a.tenant_id=pp.tenant_id where pp.paciente_id=p.id and a.id=? and pp.estado='ACTIVO') vinculado from paciente p where p.estado='ACTIVO' and regexp_replace(coalesce(p.documento_declarado,''),'[^0-9]','','g')=? order by p.id",agenda,dni);
        });
    }
    @PostMapping("/booking-patients/{patient}/link") public Object link(Principal p,@PathVariable UUID tenant,@PathVariable UUID agenda,@PathVariable UUID patient,@Valid @RequestBody Existing input){
        return tx.run(tenant,actor(p),()->{auth.requireAgenda(actor(p),agenda,"booking:create");String dni=document(input.document());registry.lock(tenant,dni);
            var matches=registry.matches(dni);if(matches.size()!=1||!patient.equals(matches.getFirst().get("id")))throw new ResponseStatusException(HttpStatus.CONFLICT,"No hay un registro único para ese DNI. Revisá el documento antes de vincular.");
            UUID global=registry.identity(dni);db.update("update paciente set identidad_global_id=? where id=? and identidad_global_id is null",global,patient);
            UUID professional=Db.uuid(db.one("select profesional_entidad_id from agenda where id=?",agenda),"profesional_entidad_id");
            UUID relation=registry.link(tenant,patient,professional);audit.record(tenant,actor(p),"PATIENT_LINKED_FOR_BOOKING","paciente_profesional",relation);return candidate(patient,relation,true);
        });
    }
    @PostMapping("/booking-patients") public Object register(Principal p,@PathVariable UUID tenant,@PathVariable UUID agenda,@Valid @RequestBody Registration input){
        return tx.run(tenant,actor(p),()->{auth.requireAgenda(actor(p),agenda,"booking:create");
            if(!PatientIdentityRegistry.document(input.document()).matches("[0-9]{6,12}"))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Ingresá un DNI válido.");
            String phone=input.phone().replaceAll("[\\s()-]","");if(!phone.matches("\\+[1-9][0-9]{7,14}"))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Ingresá el celular con código de país, por ejemplo +5491112345678.");
            if(input.firstName().isBlank()||input.lastName().isBlank()||input.address().isBlank())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Completá los seis datos del paciente.");
            UUID professional=Db.uuid(db.one("select profesional_entidad_id from agenda where id=?",agenda),"profesional_entidad_id");
            UUID patient=registry.create(tenant,input.firstName(),input.lastName(),input.document(),null,input.address().trim());
            UUID relation=registry.link(tenant,patient,professional);
            for(String type:List.of("EMAIL","WHATSAPP")){
                UUID contact=db.id("insert into contacto_paciente(tenant_id,paciente_id,tipo,valor,verificado_en,estado) values (?,?,?,?,case when ? then now() else null end,'ACTIVO') returning id",tenant,patient,type,type.equals("EMAIL")?input.email().trim():phone,input.contactConsent());
                if(input.contactConsent())db.update("insert into destino_aviso(tenant_id,paciente_id,contacto_id,canal,proposito,autorizacion_ref,desde) values (?,?,?,?,'TURNOS',?,now())",tenant,patient,contact,type,"Datos y autorización confirmados por personal: "+actor(p));
            }
            audit.record(tenant,actor(p),"PATIENT_CREATED_FOR_BOOKING","paciente",patient);return candidate(patient,relation,false);
        });
    }
    private Object candidate(UUID patient,UUID relation,boolean reused){var row=db.one("select p.id,p.nombres,p.apellidos,pp.numero_visible from paciente p join paciente_profesional pp on pp.paciente_id=p.id and pp.tenant_id=p.tenant_id where p.id=? and pp.id=?",patient,relation);row.put("reused",reused);return row;}
}
