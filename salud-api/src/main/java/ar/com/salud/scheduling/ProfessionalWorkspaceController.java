package ar.com.salud.scheduling;

import ar.com.salud.audit.Audit;
import ar.com.salud.organization.Authorization;
import ar.com.salud.shared.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.security.Principal;
import java.time.*;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController @RequestMapping("/api/v1/entities/{tenant}/agendas/{agenda}")
public class ProfessionalWorkspaceController {
    private final Db db;private final TenantTransactions tx;private final Authorization auth;private final Audit audit;private final BookingService bookings;
    public ProfessionalWorkspaceController(Db db,TenantTransactions tx,Authorization auth,Audit audit,BookingService bookings){this.db=db;this.tx=tx;this.auth=auth;this.audit=audit;this.bookings=bookings;}
    private UUID actor(Principal p){return UUID.fromString(p.getName());}
    private void owner(UUID actor,UUID tenant,UUID agenda){auth.requireAgenda(actor,agenda,"agenda:configure");db.one("select a.id from agenda a join profesional_entidad pe on pe.id=a.profesional_entidad_id and pe.tenant_id=a.tenant_id join profesional_global pg on pg.id=pe.profesional_id where a.id=? and a.tenant_id=? and pg.cuenta_id=? and pe.estado='ACTIVO'",agenda,tenant,actor);}
    public record Fee(@NotNull UUID offerVersionId,@NotNull @DecimalMin("0.00") @Digits(integer=10,fraction=2) BigDecimal amount,@NotNull @Pattern(regexp="ARS|USD") String currency){}
    @GetMapping("/fees") public Object fees(Principal p,@PathVariable UUID tenant,@PathVariable UUID agenda){return tx.run(tenant,actor(p),()->{owner(actor(p),tenant,agenda);return db.list("select distinct on (f.oferta_id) f.id,f.oferta_id,f.importe,f.moneda,f.numero_version,f.creado_en from arancel_prestacion f join oferta o on o.id=f.oferta_id and o.tenant_id=f.tenant_id where o.agenda_id=? order by f.oferta_id,f.numero_version desc",agenda);});}
    @PutMapping("/fees") public Object fee(Principal p,@PathVariable UUID tenant,@PathVariable UUID agenda,@Valid @RequestBody Fee input){return tx.run(tenant,actor(p),()->{owner(actor(p),tenant,agenda);var offer=bookings.offer(input.offerVersionId());if(!agenda.equals(offer.get("agenda_id")))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"La prestación no corresponde a esta agenda.");db.jdbc.queryForObject("select pg_advisory_xact_lock(hashtextextended(?,0))",Object.class,"fee:"+offer.get("oferta_id"));UUID id=db.id("insert into arancel_prestacion(tenant_id,oferta_id,numero_version,importe,moneda,autor_id) select ?,?,coalesce(max(numero_version),0)+1,?,?,? from arancel_prestacion where oferta_id=? returning id",tenant,offer.get("oferta_id"),input.amount(),input.currency(),actor(p),offer.get("oferta_id"));audit.record(tenant,actor(p),"FEE_REGISTERED","arancel_prestacion",id);return Map.of("id",id);});}
    @GetMapping("/activity") public Object activity(Principal p,@PathVariable UUID tenant,@PathVariable UUID agenda,@RequestParam LocalDate from,@RequestParam LocalDate until){return tx.run(tenant,actor(p),()->{auth.requireAgenda(actor(p),agenda,"booking:read");if(!until.isAfter(from)||java.time.temporal.ChronoUnit.DAYS.between(from,until)>366)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Elegí un período de hasta un año.");String zone=(String)db.one("select zona_horaria from agenda where id=?",agenda).get("zona_horaria");Instant start=from.atStartOfDay(ZoneId.of(zone)).toInstant(),end=until.atStartOfDay(ZoneId.of(zone)).toInstant();String joins=" from turno t join version_turno v on v.turno_id=t.id and v.tenant_id=t.tenant_id and v.sustituida_en is null join paciente_profesional pp on pp.id=t.paciente_profesional_id and pp.tenant_id=t.tenant_id left join recepcion_turno r on r.turno_id=t.id and r.tenant_id=t.tenant_id where v.agenda_id=? and v.inicio_atencion>=? and v.inicio_atencion<?";var summary=db.one("select count(*) total,count(*) filter(where t.estado_turno='CANCELADO') cancelados,count(*) filter(where r.estado='FINALIZADO' and t.estado_turno='REGISTRADO') atendidos,count(distinct pp.paciente_id) filter(where r.estado='FINALIZADO' and t.estado_turno='REGISTRADO') pacientes_atendidos,count(*) filter(where t.estado_turno='REGISTRADO' and coalesce(r.estado,'') not in ('ATENCION','FINALIZADO') and v.inicio_atencion>now()) proximos"+joins,agenda,start,end);var days=db.list("select (v.inicio_atencion at time zone ?)::date dia,count(*) total,count(*) filter(where t.estado_turno='CANCELADO') cancelados,count(*) filter(where r.estado='FINALIZADO' and t.estado_turno='REGISTRADO') atendidos"+joins+" group by dia order by dia",zone,agenda,start,end);return Map.of("summary",summary,"days",days);});}
    @GetMapping("/period-cancellation") public Object preview(Principal p,@PathVariable UUID tenant,@PathVariable UUID agenda,@RequestParam LocalDate date,@RequestParam @Pattern(regexp="day|week|month") String period){return tx.run(tenant,actor(p),()->{owner(actor(p),tenant,agenda);return bookings.periodPreview(agenda,date,period);});}
    @PostMapping("/period-cancellation") public Object cancel(Principal p,@PathVariable UUID tenant,@PathVariable UUID agenda,@RequestHeader("Idempotency-Key") String key,@Valid @RequestBody BookingService.PeriodCancellation input){return tx.run(tenant,actor(p),()->{owner(actor(p),tenant,agenda);return bookings.cancelPeriod(tenant,actor(p),agenda,input,key);});}
}

