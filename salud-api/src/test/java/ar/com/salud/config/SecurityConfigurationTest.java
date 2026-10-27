package ar.com.salud.config;

import ar.com.salud.shared.error.ApiExceptionHandler;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.*;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers=SecurityConfigurationTest.ProbeController.class, properties = "app.cors.allowed-origins=http://localhost:4200")
@Import({SecurityConfiguration.class, ApiExceptionHandler.class, SecurityConfigurationTest.ProbeController.class})
class SecurityConfigurationTest {
    @Autowired MockMvc mvc;

    @Test void anonymousRequestRequiresAuthentication() throws Exception {
        mvc.perform(get("/test/probe")).andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }

    @Test @WithMockUser void writesRequireCsrf() throws Exception {
        mvc.perform(post("/test/probe").contentType("application/json").content("{\"name\":\"test\"}"))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.status").value(403));
    }

    @Test @WithMockUser void authenticatedWriteWithCsrfSucceeds() throws Exception {
        mvc.perform(post("/test/probe").with(csrf()).contentType("application/json")
                .content("{\"name\":\"test\"}")).andExpect(status().isOk());
    }

    @Test @WithMockUser void validationRejectsBlankInput() throws Exception {
        mvc.perform(post("/test/probe").with(csrf()).contentType("application/json")
                .content("{\"name\":\"\"}")).andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"));
    }

    @Test @WithMockUser void methodSecurityRejectsMissingAuthority() throws Exception {
        mvc.perform(get("/test/restricted")).andExpect(status().isForbidden());
    }

    @Test @WithMockUser(authorities = "probe:read") void methodSecurityAcceptsAuthority() throws Exception {
        mvc.perform(get("/test/restricted")).andExpect(status().isOk());
    }

    @Test void corsRejectsUnknownOrigin() throws Exception {
        mvc.perform(options("/test/probe").header("Origin", "https://unknown.example")
                .header("Access-Control-Request-Method", "POST")).andExpect(status().isForbidden());
    }

    @Test void corsAllowsConfiguredOrigin() throws Exception {
        mvc.perform(options("/test/probe").header("Origin", "http://localhost:4200")
                .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4200"));
    }

    // Exists only in tests: production exposes no business endpoints or login yet.
    @RestController
    static class ProbeController {
        record Payload(@NotBlank String name) { }
        @GetMapping("/test/probe") String get() { return "ok"; }
        @PostMapping("/test/probe") String post(@Valid @RequestBody Payload payload) { return "ok"; }
        @PreAuthorize("hasAuthority('probe:read')")
        @GetMapping("/test/restricted") String restricted() { return "ok"; }
    }
}
