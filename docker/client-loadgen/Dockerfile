# docker build -t z_petclient-loadgen -f Dockerfile .

# docker run --shm-size=1g -e PETCLINIC_BASE_URL=http://spring-petclinic-client:3000 z_petclient-loadgen

# docker run -d --name z_petclient-loadgen --shm-size=1g -v $(pwd):/home/chrome -e PETCLINIC_BASE_URL=http://spring-petclinic-client:3000 z_petclient-loadgen

# docker run -p 9222:9222 z_petclient-loadgen
# docker run -p 9222:9222 --name z_petclient-loadgen z_petclient-loadgen
# docker run -p 9222:9222 --shm-size=1g --name z_petclient-loadgen -e PETCLINIC_BASE_URL=http://spring-petclinic-client:3000 z_petclient-loadgen

# Para custom_load: docker run -p 9222:9222 --shm-size=1g --name z_petclient-loadgen -e PETCLINIC_BASE_URL=http://spring-petclinic-client:3000/owners/list z_petclient-loadgen
# Para single_slow_owner: docker run -it --rm --shm-size=1g -e PETCLINIC_BASE_URL=http://spring-petclinic-client:3000 -v $(pwd):/home/chrome --user chrome z_petclient-loadgen node single_slow_owner.js


# http://localhost:9222
#
# docker exec -it z_petclient-loadgen /bin/bash
# docker cp tasks.js z_petclient-loadgen:/home/chrome/

# ==== BUILD STAGE (opcional, mas recomendado para produção) ====
FROM node AS base
#FROM node:20 AS base

# Configurações de segurança e compatibilidade
ENV NODE_TLS_REJECT_UNAUTHORIZED=0 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    CHROME_PATH=/usr/bin/google-chrome

# Instala Chrome e dependências
RUN apt-get update && apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    --no-install-recommends \
    && curl -sSL https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome-keyring.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome-keyring.gpg] https://dl.google.com/linux/chrome/deb/ stable main" \
       > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# ==== CRIA USUÁRIO NÃO ROOT ====
RUN groupadd -r chrome && useradd -r -g chrome -G audio,video chrome \
    && mkdir -p /home/chrome && chown -R chrome:chrome /home/chrome

# ==== WORKDIR E DEPENDÊNCIAS ====
WORKDIR /home/chrome

# Copia package.json primeiro (para aproveitar cache do Docker)
#COPY --chown=chrome:chrome package*.json ./
COPY --chown=chrome:chrome package.json ./

# Instala dependências como usuário não root
USER chrome
RUN npm install --unsafe-perm --legacy-peer-deps

# ==== COPIA ARQUIVOS DA APLICAÇÃO ====
COPY --chown=chrome:chrome \
    edit_owner.js \
    tasks.js \
    processes.config.js \
    single_slow_owner.js \
    users.csv \
    windows_users.csv \
    zip_codes.csv \
    ./

# ==== PORTA (opcional) ====
# Só exponha se for usar remote debugging (não recomendado para load testing)
# EXPOSE 9222

# ==== COMANDO PADRÃO: PM2 com os workers ====
CMD ["node_modules/.bin/pm2-docker", "processes.config.js"]