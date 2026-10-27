package ar.com.salud;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SaludApiApplication {

	public static void main(String[] args) {
		// JDBC sends the JVM timezone during connection startup, before Hibernate properties apply.
		TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
		SpringApplication.run(SaludApiApplication.class, args);
	}

}
