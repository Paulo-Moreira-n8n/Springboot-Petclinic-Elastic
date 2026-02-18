# ==== BUILD STAGE (opcional, mas recomendado para produção) ====
FROM node

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

# Copia e extrai os arquivos do loadgen (ADD extrai automaticamente .tar.gz)
ADD spring-rum-js-loadgen.tar.gz /home/

# ==== AJUSTA O WORKDIR ====
WORKDIR /home/chrome

# ==== CRIA USUÁRIO NÃO ROOT ====
RUN groupadd -r chrome && useradd -r -g chrome -G audio,video chrome \
    && mkdir -p /home/chrome && chown -R chrome:chrome /home/chrome

USER chrome

# ==== PORTA (opcional) ====
# Só exponha se for usar remote debugging (não recomendado para load testing)
# EXPOSE 9222

# ==== COMANDO PADRÃO: PM2 com os workers ====
CMD ["node_modules/.bin/pm2-docker", "processes.config.js"]