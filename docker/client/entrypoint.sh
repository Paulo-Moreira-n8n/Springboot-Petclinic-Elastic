
#!/bin/bash -e
echo "Loading source maps"
chmod 0666 /source_maps/*.map || true

# Espera apm-server
until  $(curl -s -o /tmp/apm_health_check.out --head --fail "${ELASTIC_APM_SERVER_URL}"); do
  echo "Waiting for APM Server..."
  sleep 1
done

# Espera Elasticsearch (com ou sem --insecure)
shopt -s nocasematch
if [[ "${INSECURE_SSL}" == "true" ]]; then
  until curl -u "${ELASTICSEARCH_USERNAME}:${ELASTICSEARCH_PASSWORD}" -s "${ELASTICSEARCH_URL}/_cat/health" "--insecure" -o /dev/null; do
    echo "Waiting for Elasticsearch..."
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
  # Ex.: /source_maps/main-abc123.js.map -> bundle: main-abc123.js
  filename=$(basename "$source_map")         # main-abc123.js.map
  bundle_js="${filename%.map}"               # main-abc123.js

  echo "Loading source map $source_map with internal URL ${PETCLINIC_INTERNAL_URL}/assets/${bundle_js}"
  response_code=$(curl -s -o /tmp/source_map.out -X POST "${ELASTIC_APM_API_URL}/api/apm/sourcemaps" -w "%{response_code}" \
    -H 'Content-Type: multipart/form-data' \
	-H 'kbn-xsrf: true' \
    -F service_name="${ELASTIC_APM_SERVICE_NAME}-react" \
    -F service_version="${ELASTIC_APM_SERVICE_VERSION}" \
    -F bundle_filepath="${PETCLINIC_INTERNAL_URL}/assets/${bundle_js}" \
    -F sourcemap=@$source_map )

  if [[ $response_code -ne 200 ]]; then
    echo "FAILED Loading source map (internal). Expected 202, got ${response_code}"
    cat /tmp/source_map.out
#    exit 1
  else
    echo "OK (internal)!"
  fi

  echo "Loading source map $source_map with external URL ${PETCLINIC_EXTERNAL_URL}/assets/${bundle_js}"
  response_code=$(curl -s -o /tmp/source_map.out -X POST "${ELASTIC_APM_API_URL}/api/apm/sourcemaps" -w "%{response_code}" \
    -H 'Content-Type: multipart/form-data' \
	-H 'kbn-xsrf: true' \
	-F service_name="${ELASTIC_APM_SERVICE_NAME}-react" \
    -F service_version="${ELASTIC_APM_SERVICE_VERSION}" \
    -F bundle_filepath="${PETCLINIC_EXTERNAL_URL}/assets/${bundle_js}" \
    -F sourcemap=@$source_map )

  if [[ $response_code -ne 200 ]]; then
    echo "FAILED Loading source map (external). Expected 202, got ${response_code}"
    cat /tmp/source_map.out
#    exit 1
  else
    echo "OK (external)!"
  fi
done

exec "$@"
