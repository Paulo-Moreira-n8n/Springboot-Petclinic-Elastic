

#!/bin/bash
set -euo pipefail
[ "${DEBUG_ENTRYPOINT:-0}" = "1" ] && set -x

echo "Loading source maps"
chmod 0666 /source_maps/*.map || true

# Espera apm-server

# Espera APM com timeout total (ex.: 60s). Endpoint correto é "/".
APM_TIMEOUT="${APM_TIMEOUT:-60}"   # segundos
APM_START=$(date +%s)
until curl -s -o /tmp/apm_health_check.out --fail "${ELASTIC_APM_SERVER_URL}/"; do
  echo "Waiting for APM Server..."
  sleep 1
  NOW=$(date +%s)
  ELAPSED=$((NOW - APM_START))
  if [ "$ELAPSED" -ge "$APM_TIMEOUT" ]; then
    echo "APM Server not ready after ${APM_TIMEOUT}s. Proceeding without sourcemaps load."
    break
  fi
done


# Espera Elasticsearch (com ou sem --insecure)
shopt -s nocasematch
if [[ "${INSECURE_SSL}" == "true" ]]; then
  until curl -u "${ELASTICSEARCH_USERNAME}:${ELASTICSEARCH_PASSWORD}" -s "${ELASTICSEARCH_URL}/_cat/health" "--insecure" -o /dev/null; do
    echo "Waiting for Elasticsearch... --insecure"
    sleep 1
  done
else
  until curl -u "${ELASTICSEARCH_USERNAME}:${ELASTICSEARCH_PASSWORD}" -s "${ELASTICSEARCH_URL}/_cat/health" -o /dev/null; do
    echo "Waiting for Elasticsearch..."
    sleep 1
  done
fi
shopt -u nocasematch

echo "Ready to load sourcemaps"

# Para cada .map gerado pelo Vite em /assets
for source_map in /source_maps/*.map; do

  echo "ENV: APM=${ELASTIC_APM_SERVER_URL} ES=${ELASTICSEARCH_URL} INT=${PETCLINIC_INTERNAL_URL} EXT=${PETCLINIC_EXTERNAL_URL}"
  echo "ENV: SERVICE_VERSION=${ELASTIC_APM_SERVICE_VERSION} SERVICE_NAME=${ELASTIC_APM_SERVICE_NAME}"

  # Ex.: /source_maps/main-abc123.js.map -> bundle: main-abc123.js
  filename=$(basename "$source_map")         # main-abc123.js.map
  bundle_js="${filename%.map}"               # main-abc123.js

  echo "Loading source map $source_map with internal URL ${PETCLINIC_INTERNAL_URL}/assets/${bundle_js}"
  response_code=$(curl -s -o /tmp/source_map.out -X POST "${ELASTIC_APM_SERVER_URL}/assets/v1/sourcemaps" -w "%{response_code}" \
    -F service_name="${ELASTIC_APM_SERVICE_NAME}-react" \
    -F service_version="${ELASTIC_APM_SERVICE_VERSION}" \
    -F bundle_filepath="${PETCLINIC_INTERNAL_URL}/assets/${bundle_js}" \
    -F sourcemap=@$source_map )

  
  if [[ $response_code -ne 202 ]]; then
    echo "WARN: sourcemap load failed (got ${response_code}). Will continue."
    cat /tmp/source_map.out
  else
    echo "OK (internal)!"
  fi

  echo "Loading source map $source_map with external URL ${PETCLINIC_EXTERNAL_URL}/assets/${bundle_js}"
  response_code=$(curl -s -o /tmp/source_map.out -X POST "${ELASTIC_APM_SERVER_URL}/assets/v1/sourcemaps" -w "%{response_code}" \
    -F service_name="${ELASTIC_APM_SERVICE_NAME}-react" \
    -F service_version="${ELASTIC_APM_SERVICE_VERSION}" \
    -F bundle_filepath="${PETCLINIC_EXTERNAL_URL}/assets/${bundle_js}" \
    -F sourcemap=@$source_map )

  if [[ $response_code -ne 202 ]]; then
    echo "FAILED Loading source map (external). Expected 202, got ${response_code}..."
    cat /tmp/source_map.out
    exit 1
  else
    echo "OK (external)!"
  fi

done

exec "$@"
