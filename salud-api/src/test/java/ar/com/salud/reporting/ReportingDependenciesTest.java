package ar.com.salud.reporting;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.HashMap;

import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.design.*;
import org.apache.commons.csv.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** Real exports using fictional data; catches missing engines/fonts and incompatible dependencies. */
class ReportingDependenciesTest {
    private static final Path OUTPUT = Path.of("target", "report-smoke");

    @Test void jasperCompilesAndExportsPdfWithSpanishFont() throws Exception {
        Files.createDirectories(OUTPUT);
        JasperDesign design = new JasperDesign();
        design.setName("infrastructure-smoke");
        design.setPageWidth(595);
        design.setPageHeight(842);
        design.setColumnWidth(555);
        design.setLeftMargin(20);
        design.setRightMargin(20);
        JRDesignStaticText text = new JRDesignStaticText();
        text.setX(0);
        text.setY(0);
        text.setWidth(550);
        text.setHeight(40);
        text.setFontName("DejaVu Sans");
        text.setText("Salud — Reporte técnico: áéíóú, ñ. Datos ficticios.");
        JRDesignBand band = new JRDesignBand();
        band.setHeight(50);
        band.addElement(text);
        design.setTitle(band);
        JasperReport report = JasperCompileManager.compileReport(design);
        JasperPrint print = JasperFillManager.fillReport(report, new HashMap<>(), new JREmptyDataSource(1));
        byte[] pdf = JasperExportManager.exportReportToPdf(print);
        assertThat(print.getPages()).hasSize(1);
        assertThat(new String(pdf, 0, 5, StandardCharsets.US_ASCII)).isEqualTo("%PDF-");
        assertThat(new String(pdf, StandardCharsets.ISO_8859_1)).contains("%%EOF");
        assertThat(pdf.length).isGreaterThan(1000);
        Files.write(OUTPUT.resolve("infrastructure.pdf"), pdf);
    }

    @Test void poiExportsAndReopensExcel() throws Exception {
        Files.createDirectories(OUTPUT);
        Path path = OUTPUT.resolve("infrastructure.xlsx");
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            var row = workbook.createSheet("Verificación").createRow(0);
            row.createCell(0).setCellValue("Reporte técnico — datos ficticios");
            row.createCell(1).setCellValue(42);
            try (OutputStream output = Files.newOutputStream(path)) { workbook.write(output); }
        }
        try (InputStream input = Files.newInputStream(path); XSSFWorkbook workbook = new XSSFWorkbook(input)) {
            var row = workbook.getSheetAt(0).getRow(0);
            assertThat(row.getCell(0).getStringCellValue()).contains("técnico");
            assertThat(row.getCell(1).getNumericCellValue()).isEqualTo(42);
        }
    }

    @Test void commonsCsvRoundTripsAccentsQuotesAndCommas() throws Exception {
        Files.createDirectories(OUTPUT);
        Path path = OUTPUT.resolve("infrastructure.csv");
        String sample = "Prueba, con \"comillas\" y ñ";
        try (Writer writer = Files.newBufferedWriter(path, StandardCharsets.UTF_8);
             CSVPrinter printer = new CSVPrinter(writer, CSVFormat.RFC4180)) {
            printer.printRecord("description", "count");
            printer.printRecord(sample, 42);
        }
        try (Reader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8);
             CSVParser parser = CSVFormat.RFC4180.builder().setHeader().setSkipHeaderRecord(true).get().parse(reader)) {
            var records = parser.getRecords();
            assertThat(records).hasSize(1);
            assertThat(records.getFirst().get("description")).isEqualTo(sample);
            assertThat(records.getFirst().get("count")).isEqualTo("42");
        }
    }
}
