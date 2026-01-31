# docker run -it -p 3000:3000 --network petclinic-stack_spring-petclinic-net -v "$(pwd):/usr/src/spring-petclinic" -w /usr/src/spring-petclinic maven bash

# -------------------------------------------------------
# STAGE 2 — Runtime do server (Express backend serving /public)
# -------------------------------------------------------
FROM node:22 AS server-runtime

ENV NODE_ENV=production
WORKDIR /usr/src/petclinic-frontend/server

# copia e extrai os arquivos do frontend da aplicação
RUN mkdir -p /usr/src/petclinic-frontend/server
COPY spring-petclinic-client.tar /usr/src/petclinic-frontend/server
RUN tar -xf spring-petclinic-client.tar && rm spring-petclinic-client.tar

# Pasta temporária para sourcemaps
RUN mkdir -p /etc/source_maps/

# Copiar todos os mapas gerados pelo Vite (ficam em /public/assets/*.map)
RUN cp ./public/assets/*.map /etc/source_maps/

# Copiar entrypoint loader de sourcemaps
COPY entrypoint.sh /etc/entrypoint.sh
RUN chmod +x /etc/entrypoint.sh

# Porta do server Node (seu bin/www usa 4000 por padrão)
EXPOSE 4000

# Comando padrão (npm start no server)
ENTRYPOINT ["/bin/bash", "-lc", "/etc/entrypoint.sh && exec npm start"]

## Injeta o agente apm RUM no arquivo index.html 
#RUN sed -i '/<title>/i\
#<script src="https://unpkg.com/@elastic/apm-rum/dist/bundles/elastic-apm-rum.umd.min.js" crossorigin><\/script>\
#<script>\
#  elasticApm.init({\
#    serviceName: "appref-frontend-service",\
#    serverUrl: "http://localhost:8200",\
#    environment: "maquina-appref",\
#	active: true,\
#	instrument: true,\
#	distributedTracingOrigins: ["http://localhost:3000"]\
#  });\
#<\/script>' /usr/share/nginx/html/index.html

