# Para construir o pacote da aplicação
# docker build -t spring-build-server -f Dockerfile .

# Para gerar o pacote da aplicação
# docker run --rm --name spring-build-server spring-build-server

# Para copiar o pacote final da aplicação
# docker cp spring-build-server:/app/target/*.jar .


# docker run -it -p 8000:8000 --network petclinic-stack_spring-petclinic-net -v "$(pwd):/usr/src/spring-petclinic" -w /usr/src/spring-petclinic maven bash

# docker run -it --rm -v "$(pwd):/usr/src/spring-petclinic" -w /usr/src/spring-petclinic maven bash

# docker run -it -p 8000:8000 -v "$(pwd):/usr/src/spring-petclinic" -w /usr/src/spring-petclinic eclipse-temurin bash




# docker build -t spring-petclinic-server -f Dockerfile .

# docker run -it --rm -p 8000:8000 -v "$(pwd):/app" -w /app `
# --network petclinic-stack_spring-petclinic-net `
# --name spring-petclinic-server `
# -e ELASTIC_APM_SERVER_URL=http://apm-server:8200 `
# -e ELASTIC_APM_SERVICE_NAME=petclinic-server-service `
# -e ELASTIC_APM_HOSTNAME=petclinic-server-host `
# maven:3.9.6-eclipse-temurin-21-alpine bash

# -e SERVER_PORT=8000 `
# -e JAVA_PROFILE=mysql,spring-data-jpa `
# -e DATABASE_URL=jdbc:mysql://mysql:3306/petclinic?useUnicode=true `
# -e DATABASE_USERNAME=root `
# -e DATABASE_PASSWORD=petclinic `
# -e DATABASE_DRIVER=com.mysql.jdbc.Driver `
# -e DATABASE_DIALECT=MYSQL `
# -e DATABASE_PLATFORM=org.hibernate.dialect.MySQLDialect `
# -e DATASOURCE_SCHEMA=classpath*:db/mysql/initDB.sql `
# -e DATASOURCE_DATA=classpath*:db/mysql/populateDB.sql `
# -e INITIALIZE_DB="true" `



# access Swagger petclinic: http://localhost:8000/petclinic/
# Swagger UI: http://localhost:8000/petclinic/swagger-ui.html.
# API documentation (OAS 3.1) is accessible at: http://localhost:8000/petclinic/v3/api-docs.

#| Ação             | Comando                                                              |
#| ---------------- | -------------------------------------------------------------------- |
#| Todos os testes  | `./mvnw clean test`                                                  |
#| Testes REST      | `./mvnw -Dtest="*Rest*" test`                                        |
#| Teste por classe | `./mvnw -Dtest=OwnerRestControllerTests test`                        |
#| Teste por método | `./mvnw -Dtest=Classe#metodo test`                                   |
#| Logs debug       | `./mvnw test -Dlogging.level.root=DEBUG`                             |
#| Perfil JPA       | `./mvnw test -Dspring.profiles.active=hsqldb,jpa,security-disabled`  |
#| Perfil JDBC      | `./mvnw test -Dspring.profiles.active=hsqldb,jdbc,security-disabled` |
#| Cobertura Jacoco | `./mvnw clean test jacoco:report`                                    |




#Multi-Stage build

FROM maven:3.9.6-eclipse-temurin-21-alpine

# Instala o certificado do zscaler para não dar erro de tls/ssl
# COPY zscalerrootca.crt /usr/local/share/ca-certificates/
# RUN update-ca-certificates

# cp zscalerrootca.crt /usr/local/share/ca-certificates/ && update-ca-certificates


# build the application
WORKDIR /app
# COPY pom.xml .travis.yml mvnw ./
COPY pom.xml ./
COPY src/ .

# RUN mvn -q -B package -DskipTests
RUN mvn package -DskipTests

RUN cp -v /app/target/*.jar /app/app.jar

CMD java -jar /app/app.jar

# RUN bash -c "while true; do sleep 30; done"

# FROM eclipse-temurin

# Baixa o agente APM Java (release oficial) em vez de compilar do fonte

# RUN apt-get update && apt-get install -y curl
# RUN curl -k -fSL "https://repo1.maven.org/maven2/co/elastic/apm/elastic-apm-agent/1.55.2/elastic-apm-agent-1.55.2.jar" -o /app/elastic-apm-agent.jar

# COPY --from=0 /usr/src/java-app/*.jar ./
# 

# 
# 
# CMD java -javaagent:/app/elastic-apm-agent.jar\
#                                         -Dspring.profiles.active=${JAVA_PROFILE:-hsqldb,spring-data-jpa}\
#                                         -Dserver.port=${SERVER_PORT:-}\
#                                         -Delastic.apm.application_packages=org.springframework.samples.petclinic\
#                                         -Dserver.context-path=/petclinic/\
#                                         -Dspring.messages.basename=messages/messages\
#                                         -Dlogging.level.org.springframework=${LOG_LEVEL:-INFO}\
#                                         -Dsecurity.ignored=${SECURITY_IGNORED:-/**}\
#                                         -Dspring.datasource.initialize=${INITIALIZE_DB:-false}\
#                                         -Dbasic.authentication.enabled=${AUTHENTICATION_ENABLED:-false}\
#                                         -Dserver.address=${SERVER_ADDRESS:-0.0.0.0}\
#                                         -Dspring.datasource.url=${DATABASE_URL:-jdbc:hsqldb:mem:petclinic}\
#                                         -Dspring.datasource.username=${DATABASE_USERNAME:-sa}\
#                                         -Dspring.datasource.password=${DATABASE_PASSWORD:-}\
#                                         -Dspring.datasource.driver-class-name=${DATABASE_DRIVER:-}\
#                                         -Dspring.jpa.database=${DATABASE_DIALECT:-HSQL}\
#                                         -Dspring.jpa.database-platform=${DATABASE_PLATFORM:-org.hibernate.dialect.HSQLDialect}\
#                                         -Dspring.jpa.hibernate.ddl-auto=${DDL_AUTO:-none}\
#                                         -Dspring.datasource.schema=${DATASOURCE_SCHEMA:-classpath*:db/hsqldb/initDB.sql}\
#                                         -Dspring.datasource.data=${DATASOURCE_DATA:-classpath*:db/hsqldb/populateDB.sql}\
#                                         -Delastic.apm.service_name=${ELASTIC_APM_SERVICE_NAME:-spring-petclinic}\
#                                         -Delastic.apm.service_version=${ELASTIC_APM_SERVICE_VERSION:-1.0.0}\
#                                         -Delastic.apm.span_frames_min_duration=${ELASTIC_APM_SPAN_FRAMES_MIN_DURATION:-5ms}\
#                                         -Delastic.apm.capture_body=${ELASTIC_APM_CAPTURE_BODY:-off}\
#                                         -Delastic.apm.environment=production\
#                                         -Delastic.apm.transaction_sample_rate=${APM_SAMPLE_RATE:-1.0}\
#                                         -Delastic.apm.server_urls=${ELASTIC_APM_SERVER_URL:-http://localhost:8200}\
#                                         -Delastic.apm.verify_server_cert=false\
#                                         -Delastic.apm.ignore_urls=/health,/metrics*,/jolokia\
#                                         -Delastic.apm.log_file=/var/log/apps/apm-spring-petclinic\
#                                         -Delastic.apm.enable_log_correlation=true\
#                                         -jar /app/app.jar
