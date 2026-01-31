const settings = {
  apm_server: process.env.ELASTIC_APM_SERVER_URL || 'http://apm-server:8200',
  apm_server_js: process.env.ELASTIC_APM_SERVER_JS_URL || 'http://apm-server:8200',
  apm_service_name: process.env.ELASTIC_APM_SERVICE_NAME || 'petclinic-node',
  apm_client_service_name: process.env.ELASTIC_APM_CLIENT_SERVICE_NAME || 'petclinic-react',
  apm_service_version: process.env.ELASTIC_APM_SERVICE_VERSION || '1.0.0',
  api_server: process.env.API_SERVER || 'http://0.0.0.0:8080',
  api_prefix: process.env.API_PREFIX || '/petclinic/api',
  address_server: process.env.ADDRESS_SERVER || 'http://0.0.0.0:5000',
  distributedTracingOrigins: process.env.DISTRIBUTED_TRACINGS_ORIGINS || 'http://petclinic-client:3000,http://petclinic-server:8000,http://localhost:4000,http://localhost:8080,http://localhost:8081'
}

module.exports = settings; // <<< obrigatório no CommonJS