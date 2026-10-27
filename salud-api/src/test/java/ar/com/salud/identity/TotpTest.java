package ar.com.salud.identity;
import org.junit.jupiter.api.Test;
import java.nio.charset.StandardCharsets;
import static org.assertj.core.api.Assertions.assertThat;
class TotpTest {
    @Test void matchesRfc6238Sha1Vectors() {
        byte[] key="12345678901234567890".getBytes(StandardCharsets.US_ASCII);
        long[] timestamps={59,1111111109,1111111111,1234567890,2000000000,20000000000L};
        String[] expected={"94287082","07081804","14050471","89005924","69279037","65353130"};
        for(int i=0;i<timestamps.length;i++)assertThat(MfaService.totp(key,timestamps[i]/30,8)).isEqualTo(expected[i]);
    }
}
