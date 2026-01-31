FROM eclipse-temurin

# Instalar curl e 
RUN apt-get update && apt-get install -y curl && apt-get install -y dos2unix

LABEL maintainer=dalem@elastic.co

ARG JMETER_VERSION="5.0"

ENV JMETER_HOME /opt/apache-jmeter-${JMETER_VERSION}
ENV	JMETER_BIN	${JMETER_HOME}/bin
ENV	JMETER_DOWNLOAD_URL https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-${JMETER_VERSION}.tgz

RUN mkdir -p /tmp/dependencies \
        && curl -k -L --silent ${JMETER_DOWNLOAD_URL} >  /tmp/dependencies/apache-jmeter-${JMETER_VERSION}.tgz \
        && mkdir -p /opt  \
        && tar -xzf /tmp/dependencies/apache-jmeter-${JMETER_VERSION}.tgz -C /opt \
        && rm -rf /tmp/dependencies

ENV PATH $PATH:$JMETER_BIN
COPY jmeter-petclinic-server.jmx ${JMETER_HOME}
RUN mkdir /opt/data_files
COPY *.csv /opt/data_files/
COPY entrypoint.sh /

RUN dos2unix entrypoint.sh

WORKDIR	${JMETER_HOME}

ENTRYPOINT ["/bin/bash", "/entrypoint.sh"]
