#!/bin/bash
#From https://github.com/justb4/docker-jmeter/blob/master/entrypoint.sh
set -e
freeMem=`awk '/MemFree/ { print int($2/1024) }' /proc/meminfo`
s=$(($freeMem/10*8))
x=$(($freeMem/10*8))
n=$(($freeMem/10*2))
export JVM_ARGS="-Xmn${n}m -Xms${s}m -Xmx${x}m"

# antes de chamar o jmeter
BASE_URL="${ENDPOINT_PROTOCOL:-http}://${ENDPOINT_BASE:-spring-petclinic-client}:${ENDPOINT_PORT:-3000}"

echo "Aguardando serviço em ${BASE_URL} ..."
for i in {1..60}; do
  if curl -fsS "${BASE_URL}/api/owners" >/dev/null; then
    echo "Serviço OK!"
    break
  fi
  echo "Ainda não... tentativa $i/60"
  sleep 2
done

echo "START Running Jmeter on `date`"
echo "JVM_ARGS=${JVM_ARGS}"
echo "jmeter args=$@"

jmeter -Dlog_level.jmeter=DEBUG -JTIMER_DEVIATION=${TIMER_DEVIATION:-2000} -JTIMER_OFFSET=${TIMER_OFFSET:-500} -JERROR_TIMER_DEVIATION=${ERROR_TIMER_DEVIATION:-30000} -JERROR_TIME_OFFSET=${ERROR_TIME_OFFSET:-15000} -JDATA_FILES=${DATA_FILES:-/opt/data_files} -JENDPOINT_BASE=${ENDPOINT_BASE:-spring-petclinic-client} -JENDPOINT_PORT=${ENDPOINT_PORT:-3000} -JENDPOINT_PROTOCOL=${ENDPOINT_PROTOCOL:-http} -n -t ${JMETER_HOME}/jmeter-petclinic-server.jmx -j /dev/stdout
# jmeter -Dlog_level.jmeter=DEBUG -Jjmeter.save.saveservice.response_data.on_error=true -JTIMER_DEVIATION=${TIMER_DEVIATION:-2000} -JTIMER_OFFSET=${TIMER_OFFSET:-500} -JERROR_TIMER_DEVIATION=${ERROR_TIMER_DEVIATION:-30000} -JERROR_TIME_OFFSET=${ERROR_TIME_OFFSET:-15000} -JDATA_FILES=${DATA_FILES:-/opt/data_files} -JENDPOINT_BASE=${ENDPOINT_BASE:-spring-petclinic-client} -JENDPOINT_PORT=${ENDPOINT_PORT:-3000} -JENDPOINT_PROTOCOL=${ENDPOINT_PROTOCOL:-http} -n -t ${JMETER_HOME}/jmeter-petclinic-server.jmx -l /tmp/results.jtl -j /dev/stdout

tail -n 50 /tmp/results.jtl || true

echo "END Running Jmeter on `date`"
