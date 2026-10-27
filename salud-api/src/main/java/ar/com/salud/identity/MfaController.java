package ar.com.salud.identity;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.security.Principal;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/auth/mfa")
public class MfaController {
    private final MfaService mfa;
    public MfaController(MfaService mfa){this.mfa=mfa;}
    public record Enroll(@NotBlank @Size(max=128) String password){}
    public record Verify(@NotNull @Pattern(regexp="[0-9]{6}") String code){}
    @PostMapping("/enroll")public Object enroll(Principal p,@Valid @RequestBody Enroll b,HttpServletRequest req){return mfa.enroll(UUID.fromString(p.getName()),b.password(),req.getRemoteAddr());}
    @PostMapping("/verify")public void verify(Principal p,@Valid @RequestBody Verify b,HttpServletRequest req){mfa.verify(UUID.fromString(p.getName()),b.code(),req.getSession(false).getId());}
}
