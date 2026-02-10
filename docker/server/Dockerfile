# Usa uma imagem base do OpenJDK
FROM eclipse-temurin

# Define o diretório onde o app será copiado
WORKDIR /app

# Copia o jar do backend da aplicação
COPY spring-petclinic-3.3.7.jar spring-petclinic.jar

# Copia o agente Elastic APM Java (release oficial)
COPY elastic-apm-agent-1.55.2.jar elastic-apm-agent.jar

# Portas expostas
EXPOSE 8000

# Comando para executar a aplicação com o agente APM
CMD ["java", "-javaagent:/app/elastic-apm-agent.jar", "-jar", "/app/spring-petclinic.jar"]
