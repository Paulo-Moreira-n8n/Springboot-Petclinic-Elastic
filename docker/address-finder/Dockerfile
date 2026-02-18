FROM python:3.6-stretch

ENV PYTHONHTTPSVERIFY=0 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HOME=/root \
    DEBIAN_FRONTEND=noninteractive

# copia e extrai os arquivos da aplicação (ADD extrai automaticamente .tar.gz)
ADD spring-address-finder.tar.gz /app

WORKDIR /app/src

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

ENTRYPOINT ["/usr/local/bin/gunicorn", "--config", "gunicorn.conf", "--log-config", "logging.conf", "-b", ":5000", "server:app"]