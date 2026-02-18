# -------------------------------------------------------
# Runtime do server (Express backend serving /public)
# -------------------------------------------------------

FROM node

ENV NODE_ENV=production

# copia e extrai os arquivos do frontend da aplicação (ADD extrai automaticamente .tar.gz)
ADD spring-petclinic-client.tar.gz /usr/src/petclinic-frontend/

# Ajusta o workdir para o server
WORKDIR /usr/src/petclinic-frontend/server

# Porta do server Node (no seu bin/www está definido 3000)
EXPOSE 3000

# Comando padrão (npm start no server)
CMD ["npm", "start"]
#ENTRYPOINT ["/bin/bash", "entrypoint.sh"]
