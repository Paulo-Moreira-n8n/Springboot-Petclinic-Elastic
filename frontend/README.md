
# Spring Petclinic — Frontend Stack (Vite + Node + APM + ES + Kibana)

Este documento descreve como subir e operar a stack **frontend** integrada com **Elastic APM Server**, **Elasticsearch** e **Kibana** via Docker Compose.

## 📦 Serviços

- **petclinic-frontend** — servidor Node/Express, serve o build do client (Vite).
- **apm-server** — recebe dados do APM (Node Agent e RUM) e publica no ES.
- **elasticsearch** — armazena eventos, traces e sourcemaps.
- **kibana** — UI para explorar logs, traces e dashboards APM.

## 🔗 Endpoints (locais)

| Serviço              | URL                               | Observações                                 |
|----------------------|------------------------------------|---------------------------------------------|
| Frontend             | http://localhost:4000             | Healthcheck: `/healthcheck`                 |
| APM Server           | http://localhost:8200/healthcheck | Intake/RUM: `/intake`, `/v1/rum/sourcemaps` |
| Elasticsearch (API)  | http://localhost:9200/_cat/health | Usuário: `elastic` (ver credenciais abaixo) |
| Kibana               | http://localhost:5601             | UI: Login com credenciais do ES             |

> O **entrypoint** do frontend carrega *sourcemaps* do Vite para o APM em `/v1/rum/sourcemaps`, usando as URLs configuradas para `PETCLINIC_INTERNAL_URL` e `PETCLINIC_EXTERNAL_URL`.

## 🔐 Credenciais (dev)

> Em **dev**, usamos valores padrão para facilitar. Em produção, **não** utilize senhas triviais.

- **Elasticsearch**
  - Usuário: `${ELASTICSEARCH_USERNAME:-elastic}`
  - Senha: `${ELASTICSEARCH_PASSWORD:-changeme}`

- **APM Server**
  - Sem token por padrão (liberado para RUM e sourcemaps)
  - (Opcional) defina `APM_SECRET_TOKEN` para intake protegido

> Os valores são definidos via `docker-compose.yml` (podem ser sobrescritos em `.env`).

## ⚙️ Variáveis importantes

- **Front (entrypoint)**
  - `ELASTIC_APM_SERVER_URL`: `http://apm-server:8200`
  - `ELASTICSEARCH_URL`: `http://elasticsearch:9200`
  - `ELASTICSEARCH_USERNAME`/`ELASTICSEARCH_PASSWORD`
  - `ELASTIC_APM_SERVICE_NAME`: `petclinic-react` (default)
  - `ELASTIC_APM_SERVICE_VERSION`: `1.0.0` (default)
  - `PETCLINIC_INTERNAL_URL`: `http://petclinic-frontend:4000` (default)
  - `PETCLINIC_EXTERNAL_URL`: `http://localhost:4000` (default)
  - `INSECURE_SSL`: `false` (default)

- **Kibana**
  - `ELASTICSEARCH_HOSTS`: `["http://elasticsearch:9200"]`
  - `ELASTICSEARCH_USERNAME`/`ELASTICSEARCH_PASSWORD`
  - (Opcional) `server.publicBaseUrl`: URL pública do Kibana

## ▶️ Subir a stack com debug

```bash


cd spring-petclinic/frontend

docker compose -f docker-compose.override.yml up -d --build

docker compose up -d --build


# Estado dos serviços
docker compose ps

# Logs (3 min de histórico)
docker compose logs --since=3m petclinic-frontend
docker compose logs --since=3m apm-server
docker compose logs --since=3m elasticsearch
docker compose logs --since=3m kibana

# Health e diagnóstico interno
curl -fsS http://localhost:4000/healthcheck || true
curl -fsS http://localhost:4000/diag || true
curl -fsS http://localhost:8200/healthcheck || true
curl -fsS http://localhost:9200/_cat/health -u elastic:changeme || true

# Testes internos “de dentro” do container (DNS / rede / proxy)
docker exec -it petclinic-frontend sh -lc 'apk add --no-cache curl >/dev/null 2>&1 || true; curl -v http://apm-server:8200/healthcheck'
docker exec -it petclinic-frontend sh -lc 'curl -v -u $ELASTICSEARCH_USERNAME:$ELASTICSEARCH_PASSWORD $ELASTICSEARCH_URL/_cat/health'




# Com override ativo, o server sobe com --inspect em 0.0.0.0:9229

docker compose logs -f petclinic-frontend


cd spring-petclinic/frontend

# Build da imagem do frontend
docker compose build

# Sobe todos os serviços
docker compose up -d

# Ver log de saúde
docker compose logs -f petclinic-frontend
docker compose logs -f apm-server
docker compose logs -f elasticsearch
docker compose logs -f kibana

