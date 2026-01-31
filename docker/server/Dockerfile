# Usa uma imagem base do OpenJDK
FROM eclipse-temurin

# Define as versões do app e do agente apm
ARG VERSAO_APPREF="0.4.3+91"
ARG VERSAO_APMAGENT="1.55.3"

# Define a URL base do backend da aplicação de referência
ENV BASE_URL_APPREF="http://www-bin/repository/binary-releases/br/gov/dataprev/padroes-dev/aplicacao-referencia-backend-springboot/aplicacao-referencia-backend-springboot"

# Define a URL base do agente elastic
ENV BASE_URL_APMAGENT="https://repo1.maven.org/maven2/co/elastic/apm/elastic-apm-agent-java8"

# Define o diretório onde o app será instalado
WORKDIR /app

# copia e extrai o jar do backend da aplicação de referência
COPY spring-petclinic-3.3.7.jar .

# Baixa o agente Elastic APM Java (release oficial)
# RUN curl -k -fSL -o elastic-apm-agent.jar "${BASE_URL_APMAGENT}/${VERSAO_APMAGENT}/elastic-apm-agent-java8-${VERSAO_APMAGENT}.jar"

# Portas expostas
EXPOSE 8000

# Comando para executar a aplicação com o agente APM
CMD ["java", "-jar", "/app/spring-petclinic-3.3.7.jar"]

# CMD ["java", "-javaagent:/app/elastic-apm-agent.jar", "-Dfile.encoding=UTF-8", "-jar", "/app/aplicacao-referencia-backend-springboot.jar"]

