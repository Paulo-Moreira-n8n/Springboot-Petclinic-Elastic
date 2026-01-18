#!/bin/bash
cron
/usr/bin/db_sync -c 1 &
/usr/local/bin/docker-entrypoint.sh mysqld
