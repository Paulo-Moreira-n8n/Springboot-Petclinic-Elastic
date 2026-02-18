FROM eclipse-temurin

# Extrai o pacote do loadgen com Apache Jmeter
ADD spring-node-js-loadgen.tar.gz /.

# Garantir permissões de execução
RUN chmod -R +x /opt

ENV JMETER_HOME=/opt/apache-jmeter \
    PATH=$PATH:/opt/apache-jmeter/bin

ENTRYPOINT ["/bin/bash", "/opt/entrypoint.sh"]
