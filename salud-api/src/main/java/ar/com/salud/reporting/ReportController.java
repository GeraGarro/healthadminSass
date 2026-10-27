package ar.com.salud.reporting;

import ar.com.salud.audit.Audit;
import ar.com.salud.organization.Authorization;
import ar.com.salud.shared.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.time.*;
import java.util.*;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.design.*;
import org.apache.commons.csv.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/entities/{tenant}/reports")
public class ReportController {
    private final Db db;private final TenantTransactions tx;private final Authorization auth;private final Audit audit;
    public ReportController(Db db,TenantTransactions tx,Authorization auth,Audit audit){this.db=db;this.tx=tx;this.auth=auth;this.audit=audit;}
    @GetMapping("/appointments") public ResponseEntity<byte[]> export(Principal p,@PathVariable UUID tenant,
        @RequestParam UUID agendaId,@RequestParam LocalDate from,@RequestParam LocalDate until,@RequestParam(defaultValue="csv") String format) {
        UUID actor=UUID.fromString(p.getName());
        if(from.isAfter(until)||from.plusDays(30).isBefore(until)||!Set.of("csv","xlsx","pdf").contains(format)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Rango máximo 31 días; formatos csv, xlsx o pdf.");
        var data=tx.run(tenant,actor,() -> {
            auth.requireAgenda(actor,agendaId,"booking:read");
            var rows=db.list("select pp.numero_visible,v.inicio_atencion,v.fin_atencion,t.estado_turno,t.estado_asistencia from turno t join version_turno v on v.turno_id=t.id and v.tenant_id=t.tenant_id and v.sustituida_en is null join paciente_profesional pp on pp.id=t.paciente_profesional_id and pp.tenant_id=t.tenant_id where v.agenda_id=? and (v.inicio_atencion at time zone v.zona_horaria)::date between ? and ? order by v.inicio_atencion limit 1001",agendaId,from,until);
            if(rows.size()>1000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Reduzca el rango: más de 1000 turnos.");
            audit.record(tenant,actor,"REPORT_EXPORTED","agenda",agendaId);return rows;
        });
        try {
            List<List<String>> rows=new ArrayList<>();rows.add(List.of("Paciente N°","Inicio UTC","Fin UTC","Turno","Asistencia"));
            for(var r:data) rows.add(List.of(r.get("numero_visible").toString(),Db.instant(r,"inicio_atencion").toString(),Db.instant(r,"fin_atencion").toString(),r.get("estado_turno").toString(),r.get("estado_asistencia").toString()));
            byte[] bytes=switch(format){case "xlsx" -> excel(rows);case "pdf" -> pdf(rows);default -> csv(rows);};
            String media=switch(format){case "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";case "pdf" -> "application/pdf";default -> "text/csv;charset=UTF-8";};
            return ResponseEntity.ok().header("Cache-Control","no-store").header("Content-Disposition","attachment; filename=turnos."+format).contentType(MediaType.parseMediaType(media)).body(bytes);
        }catch(Exception e){throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"No se pudo generar el reporte.",e);}
    }
    private byte[] csv(List<List<String>> rows)throws IOException {
        StringWriter writer=new StringWriter();
        try(CSVPrinter printer=new CSVPrinter(writer,CSVFormat.RFC4180)){for(var row:rows) printer.printRecord(row.stream().map(s -> s.matches("^[=+@\\-\\t\\r].*")?"'"+s:s).toList());}
        return writer.toString().getBytes(StandardCharsets.UTF_8);
    }
    private byte[] excel(List<List<String>> rows)throws IOException {
        try(var workbook=new XSSFWorkbook();var output=new ByteArrayOutputStream()){
            var sheet=workbook.createSheet("Turnos");int index=0;
            for(var row:rows){var target=sheet.createRow(index++);for(int i=0;i<row.size();i++)target.createCell(i).setCellValue(row.get(i));}
            sheet.createFreezePane(0,1);for(int i=0;i<5;i++)sheet.setColumnWidth(i,28*256);workbook.write(output);return output.toByteArray();
        }
    }
    private byte[] pdf(List<List<String>> rows)throws JRException {
        JasperDesign design=new JasperDesign();design.setName("turnos");design.setPageWidth(842);design.setPageHeight(595);design.setColumnWidth(802);design.setLeftMargin(20);design.setRightMargin(20);design.setTopMargin(20);design.setBottomMargin(20);
        var field=new JRDesignField();field.setName("line");field.setValueClass(String.class);design.addField(field);
        var text=new JRDesignTextField();text.setX(0);text.setY(0);text.setWidth(800);text.setHeight(18);text.setFontName("DejaVu Sans");text.setFontSize(8f);text.setExpression(new JRDesignExpression("$F{line}"));
        var band=new JRDesignBand();band.setHeight(20);band.addElement(text);((JRDesignSection)design.getDetailSection()).addBand(band);
        var maps=rows.stream().map(r -> Map.<String,Object>of("line",String.join("   |   ",r))).toList();
        return JasperExportManager.exportReportToPdf(JasperFillManager.fillReport(JasperCompileManager.compileReport(design),new HashMap<>(),new net.sf.jasperreports.engine.data.JRMapCollectionDataSource(new ArrayList<>(maps))));
    }
}
