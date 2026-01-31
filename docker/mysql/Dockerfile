FROM mysql:8.0-debian

RUN apt-get -y update && \
    apt-get install -y stress cron curl wget apt-transport-https awscli
RUN cp /usr/bin/stress /usr/bin/db_backup
RUN cp /usr/bin/stress /usr/bin/db_sync
COPY mysql-docker.cnf /etc/mysql/conf.d/docker.cnf
COPY db_ready.sh /etc/db_ready.sh
COPY backup_db.sh /etc/backup_db.sh
COPY schedule_backup.txt /etc/cron.d/schedule_backup
RUN crontab -u root /etc/cron.d/schedule_backup
RUN chmod 755 /etc/backup_db.sh
RUN chmod 755 /etc/db_ready.sh
RUN service cron start
COPY wrapper.sh /etc/wrapper.sh
RUN chmod 755 /etc/wrapper.sh
RUN base64 /dev/urandom | head -c 300000000 > /opt/db_backup.sql
ENTRYPOINT ["/etc/wrapper.sh"]
