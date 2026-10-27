# Build from source: no Java/Maven installation or prebuilt JAR required on the host.
FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
# The wrapper checksum is for the ZIP distribution; without unzip it downloads TAR instead.
RUN apt-get update && apt-get install -y --no-install-recommends unzip
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw
COPY src/main/ src/main/
COPY docker/Healthcheck.java docker/Healthcheck.java
RUN javac -d /src/healthcheck docker/Healthcheck.java
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -ntp --strict-checksums -Dmaven.test.skip=true package

FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app
COPY --from=build /src/target/salud-api-*.jar /app/app.jar
# Java's HTTP client is also used by Compose, without adding curl to the runtime.
COPY --from=build /src/healthcheck/Healthcheck.class /app/Healthcheck.class
USER 10001:10001
EXPOSE 8080
ENTRYPOINT ["java","-XX:MaxRAMPercentage=70.0","-jar","/app/app.jar"]
