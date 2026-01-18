#!/bin/bash

if [ -z "$BACKUP_CORES" ]; then
    BACKUP_CORES=128
fi

if [ -z "$BACKUP_TIMEOUT" ]; then
    BACKUP_TIMEOUT=120
fi

nohup db_backup -c 128 -t 120 &
mysql -u root --password="${MYSQL_ROOT_PASSWORD}" -e "FLUSH TABLES WITH READ LOCK;"
mysql -u root --password="${MYSQL_ROOT_PASSWORD}" petclinic -e "SELECT * FROM pets, owners, vets, visits;" > backup.txt
mysql -u root --password="${MYSQL_ROOT_PASSWORD}" -e "UNLOCK TABLES;"
aws s3 cp /opt/db_backup.sql s3://sa.temp/db_backup/
