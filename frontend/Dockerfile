# docker build -t spring-petclinic-client:latest .

# docker run -it -p 3000:3000 --name testa-appref -v "$(pwd):/app" -w /app registry.ctn.prevnet/redhat/openjdk-11-rhel8:1.3 bash

#docker run -it -p 4000:4000 --name testa-appref -v "$(pwd):/usr/src/petclinic-frontend" -w /usr/src/petclinic-frontend `
# --network docker-elk_elk `
# -e ELASTIC_APM_SERVER_URL=http://apm-server:8200 `
# -e ELASTICSEARCH_URL=http://elasticsearch:9200 `
# -e ELASTICSEARCH_USERNAME=elastic `
# -e ELASTICSEARCH_PASSWORD=changeme `
# -e PETCLINIC_INTERNAL_URL=http://gera-aplicacao:4000 `
# -e PETCLINIC_EXTERNAL_URL=https://localhost:4000 `
# -e ELASTIC_APM_SERVICE_NAME=spring-petclinic-client `
# -e ELASTIC_APM_SERVICE_VERSION=1.0.0 `
# -e INSECURE_SSL=false `
# -e ADDRESS_SERVER=http://0.0.0.0:5000 `
# -e ELASTIC_APM_SERVER_JS_URL=http://localhost:8200 `
# -e ELASTIC_APM_CLIENT_SERVICE_NAME=petclinic-client `
# -e API_SERVER=http://0.0.0.0:8080 `
# -e API_PREFIX=/petclinic/api `
# -e DISTRIBUTED_TRACINGS_ORIGINS=http://petclinic-client:3000,http://petclinic-server:8000,http://localhost:4000,http://localhost:8080,http://localhost:8081 `
# node:22 bash

# definir variável de ambiente já estando dentro do contêiner:
# export ADDRESS_SERVER=http://spring-address-finder:5000
# echo $ADDRESS_SERVER


# docker run -it --rm -p 3000:3000 --name gera-aplicacao -v "$(pwd):/app" -w /app node:22 bash

# docker run -it --rm -p 4000:4000 --name gera-aplicacao -v "$(pwd):/app" -w /app node:22 bash

# -------------------------------------------------------
# STAGE 1 — Build do client (React 19 + Vite 7)
# -------------------------------------------------------
FROM node:22 AS client-build

# Instala o certificado do zscaler para não dar erro de tls
COPY zscalerrootca.crt /usr/local/share/ca-certificates/

# cp zscalerrootca.crt /usr/local/share/ca-certificates/

RUN update-ca-certificates

WORKDIR /usr/src/petclinic-frontend/client

# Copiar arquivos de manifesto primeiro para cache de dependências
COPY client/package.json client/package-lock.json* ./
#COPY client/package.json package.json
#COPY client/package-lock.json package-lock.json

# Instalação de dependências (modo CI garante determinismo e falha em caso de lock inconsistente)
RUN npm ci --legacy-peer-deps
#RUN npm install --legacy-peer-deps

# Copiar código-fonte do client
COPY client/ .

# Build de produção (Vite gera /dist com /assets/*.js e *.js.map)
RUN npm run build

# -------------------------------------------------------
# STAGE 2 — Runtime do server (Express backend serving /public)
# -------------------------------------------------------
FROM node:22 AS server-runtime

ENV NODE_ENV=production
WORKDIR /usr/src/petclinic-frontend/server

# Copiar manifestos do server e instalar deps de produção
COPY server/package.json server/package-lock.json* ./
RUN npm ci --omit=dev
#RUN npm install --omit=dev

# Copiar código do server
COPY server/ .

# Copiar build do client para a pasta pública do server
# Vite gera index.html e assets com hash; public/ serve o SPA
COPY --from=client-build /usr/src/petclinic-frontend/client/dist/index.html ./public/index.html
COPY --from=client-build /usr/src/petclinic-frontend/client/dist/assets ./public/assets

# cp /usr/src/petclinic-frontend/client/dist/index.html ./public/index.html
# cp -r /usr/src/petclinic-frontend/client/dist/assets ./public/assets


# Opcional: se você também tiver imagens/ícones em client/public, copie:
# COPY --from=client-build /usr/src/petclinic-frontend/client/dist/public ./public

# -------------------------------------------------------
# STAGE 3 — Loader de sourcemaps (requer curl) + entrypoint
# -------------------------------------------------------
# Instalar utilitários (curl) no runtime ou usar imagem base já com curl
# RUN apk add --no-cache curl bash
# Pasta temporária para sourcemaps
RUN mkdir -p /source_maps

# Copiar todos os mapas gerados pelo Vite (ficam em /dist/assets/*.map)
COPY --from=client-build /usr/src/petclinic-frontend/client/dist/assets/*.map /source_maps/

# cp /usr/src/petclinic-frontend/client/dist/assets/*.map /source_maps

# Copiar entrypoint loader de sourcemaps
COPY entrypoint.sh /etc/entrypoint.sh
# cp /usr/src/petclinic-frontend/entrypoint.sh /etc/entrypoint.sh
RUN chmod +x /etc/entrypoint.sh

# Porta do server Node (seu bin/www usa 4000 por padrão)
EXPOSE 4000

# Comando padrão (npm start no server)
ENTRYPOINT ["/bin/bash", "-lc", "/etc/entrypoint.sh && exec npm start"]

# bash -lc /etc/entrypoint.sh && exec npm start

# CMD ["npm", "start"]
# ENTRYPOINT ["/bin/bash", "/etc/entrypoint.sh"]
