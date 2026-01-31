# docker build -t spring-address-finder -f Dockerfile .

# docker run -p 5000:5000 --name spring-address-finder --network docker-elk_elk `
#  -e ELASTIC_APM_SERVER_URL=http://apm-server:8200 `
#  -e ELASTIC_APM_SERVICE_VERSION=1.0.0 `
#  -e ELASTIC_APM_SERVICE_NAME=petclinic-address-finder `
#  -e ELASTIC_APM_HOSTNAME=petclinic-address-host `
#  -e ELASTIC_APM_CLIENT_SERVICE_NAME=petclinic-address-service `
#  -e ELASTICSEARCH_USER=elastic `
#  -e ELASTICSEARCH_PASSWORD=changeme `
#  -e ELASTICSEARCH_URL=http://elasticsearch:9200 `
#  spring-address-finder


# http://localhost:5000

FROM python:3.6-stretch

ENV PYTHONHTTPSVERIFY=0

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV HOME=/root
ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /usr/src/
RUN git clone -c http.sslVerify=false https://github.com/elastic/spring-petclinic.git

WORKDIR /usr/src/spring-petclinic/address_resolver/src

COPY requirements.txt requirements.txt

RUN cp gunicorn.conf gunicorn.conf.py

RUN pip install \
    --trusted-host pypi.org \
    --trusted-host pypi.python.org \
    --trusted-host files.pythonhosted.org \
    gunicorn json-logging-py

RUN pip install \
    --trusted-host pypi.org \
    --trusted-host pypi.python.org \
    --trusted-host files.pythonhosted.org \
	--no-cache-dir -r requirements.txt

EXPOSE 5000

ENTRYPOINT ["/usr/local/bin/gunicorn", "--config", "gunicorn.conf.py", "--log-config", "logging.conf", "-b", ":5000", "server:app"]
