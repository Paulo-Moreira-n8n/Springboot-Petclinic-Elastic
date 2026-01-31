# docker run -it -p 8000:8000 --network petclinic-stack_spring-petclinic-net -v "$(pwd):/usr/src/spring-petclinic" -w /usr/src/spring-petclinic maven bash

# docker run -it -p 8000:8000 -v "$(pwd):/usr/src/spring-petclinic" -w /usr/src/spring-petclinic eclipse-temurin bash

# docker build -t spring-petclinic-server -f Dockerfile .
# docker run -p 8000:8000 --network docker-elk_elk --name spring-petclinic-server
# --network docker-elk_elk `
# -e ELASTIC_APM_SERVER_URL=http://apm-server:8200 `
# -e ELASTIC_APM_SPAN_FRAMES_MIN_DURATION=-1 `
# -e ELASTIC_APM_CAPTURE_BODY=all `
# -e SERVER_PORT=8000 `
# -e ELASTIC_APM_SERVICE_NAME=spring-petclinic-server
# spring-petclinic-server





# docker run -it -p 8000:8000 --name gera-aplicacao-2 -v "$(pwd):/usr/src/spring-petclinic" -w /usr/src/spring-petclinic `
# --network docker-elk_elk `
# -e ELASTIC_APM_SERVER_URL=http://apm-server:8200 `
# -e ELASTIC_APM_SPAN_FRAMES_MIN_DURATION=-1 `
# -e ELASTIC_APM_CAPTURE_BODY=all `
# -e SERVER_PORT=8000 `
# -e ELASTIC_APM_SERVICE_NAME=spring-petclinic-server
# maven:3.5.3-jdk-10 bash

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



# access petclinic: http://localhost:9966/petclinic/
# actuator health check: http://localhost:9966/petclinic/actuator/health
# Swagger UI: http://localhost:9966/petclinic/swagger-ui.html.
# API documentation (OAS 3.1) is accessible at: http://localhost:9966/petclinic/v3/api-docs.

#Multi-Stage build

#Build application stage
#We need maven.
FROM maven:3.5.3-jdk-10
ARG JAVA_AGENT_BRANCH=1.x
ARG JAVA_AGENT_REPO=elastic/apm-agent-java

# Instala o certificado do zscaler para não dar erro de tls/ssl
COPY zscalerrootca.crt /usr/local/share/ca-certificates/
# cp zscalerrootca.crt /usr/local/share/ca-certificates/
RUN update-ca-certificates

#WORKDIR /usr/src
#build the application
#RUN git clone https://github.com/elastic/spring-petclinic.git
WORKDIR /usr/src/spring-petclinic
COPY pom.xml .travis.yml mvnw ./
# cp pom.xml .travis.yml mvnw ./
COPY src/ .


# RUN mvn -q -B package -DskipTests
RUN mvn package

RUN mkdir /usr/src/java-app
RUN cp -v /usr/src/spring-petclinic/target/*.jar /usr/src/java-app/app.jar

#build the agent
#WORKDIR /usr/src/java-agent-code
#RUN curl -k -L https://github.com/$JAVA_AGENT_REPO/archive/$JAVA_AGENT_BRANCH.tar.gz | tar --strip-components=1 -xz

RUN mvn -q -B package -DskipTests

# baixa o agente java elastic-apm-agent

# Baixa o agente APM Java (release oficial) em vez de compilar do fonte
# RUN curl -fSL "https://repo1.maven.org/maven2/co/elastic/apm/elastic-apm-agent/1.55.2/elastic-apm-agent-1.55.2.jar" -o /usr/src/java-app/elastic-apm-agent.jar


#RUN export JAVA_AGENT_BUILT_VERSION=$(mvn -q -Dexec.executable="echo" -Dexec.args='${project.version}' --non-recursive org.codehaus.mojo:exec-maven-plugin:1.3.1:exec) \
#    && cp -v /usr/src/java-agent-code/elastic-apm-agent/target/elastic-apm-agent-${JAVA_AGENT_BUILT_VERSION}.jar /usr/src/java-app/elastic-apm-agent.jar


FROM eclipse-temurin

RUN export
WORKDIR /app

# Baixa o agente APM Java (release oficial) em vez de compilar do fonte

RUN apt-get update && apt-get install -y curl
RUN curl -k -fSL "https://repo1.maven.org/maven2/co/elastic/apm/elastic-apm-agent/1.55.2/elastic-apm-agent-1.55.2.jar" -o /app/elastic-apm-agent.jar
# Baixe diretamente o JAR
# RUN wget https://repo1.maven.org/maven2/co/elastic/apm/elastic-apm-agent/1.47.0/elastic-apm-agent-1.47.0.jar

COPY --from=0 /usr/src/java-app/*.jar ./

CMD java -javaagent:/app/elastic-apm-agent.jar\
                                        -Dspring.profiles.active=${JAVA_PROFILE:-hsqldb,spring-data-jpa}\
                                        -Dserver.port=${SERVER_PORT:-}\
                                        -Delastic.apm.application_packages=org.springframework.samples.petclinic\
                                        -Dserver.context-path=/petclinic/\
                                        -Dspring.messages.basename=messages/messages\
                                        -Dlogging.level.org.springframework=${LOG_LEVEL:-INFO}\
                                        -Dsecurity.ignored=${SECURITY_IGNORED:-/**}\
                                        -Dspring.datasource.initialize=${INITIALIZE_DB:-false}\
                                        -Dbasic.authentication.enabled=${AUTHENTICATION_ENABLED:-false}\
                                        -Dserver.address=${SERVER_ADDRESS:-0.0.0.0}\
                                        -Dspring.datasource.url=${DATABASE_URL:-jdbc:hsqldb:mem:petclinic}\
                                        -Dspring.datasource.username=${DATABASE_USERNAME:-sa}\
                                        -Dspring.datasource.password=${DATABASE_PASSWORD:-}\
                                        -Dspring.datasource.driver-class-name=${DATABASE_DRIVER:-}\
                                        -Dspring.jpa.database=${DATABASE_DIALECT:-HSQL}\
                                        -Dspring.jpa.database-platform=${DATABASE_PLATFORM:-org.hibernate.dialect.HSQLDialect}\
                                        -Dspring.jpa.hibernate.ddl-auto=${DDL_AUTO:-none}\
                                        -Dspring.datasource.schema=${DATASOURCE_SCHEMA:-classpath*:db/hsqldb/initDB.sql}\
                                        -Dspring.datasource.data=${DATASOURCE_DATA:-classpath*:db/hsqldb/populateDB.sql}\
                                        -Delastic.apm.service_name=${ELASTIC_APM_SERVICE_NAME:-spring-petclinic}\
                                        -Delastic.apm.service_version=${ELASTIC_APM_SERVICE_VERSION:-1.0.0}\
                                        -Delastic.apm.span_frames_min_duration=${ELASTIC_APM_SPAN_FRAMES_MIN_DURATION:-5ms}\
                                        -Delastic.apm.capture_body=${ELASTIC_APM_CAPTURE_BODY:-off}\
                                        -Delastic.apm.environment=production\
                                        -Delastic.apm.transaction_sample_rate=${APM_SAMPLE_RATE:-1.0}\
                                        -Delastic.apm.server_urls=${ELASTIC_APM_SERVER_URL:-http://localhost:8200}\
                                        -Delastic.apm.verify_server_cert=false\
                                        -Delastic.apm.ignore_urls=/health,/metrics*,/jolokia\
                                        -Delastic.apm.log_file=/var/log/apps/apm-spring-petclinic\
                                        -Delastic.apm.enable_log_correlation=true\
                                        -jar /app/app.jar
