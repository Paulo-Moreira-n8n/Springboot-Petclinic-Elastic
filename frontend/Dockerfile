FROM node:8

RUN mkdir /usr/src/petclinic-frontend
ENV PATH /usr/src/petclinic-frontend/client/node_modules/.bin:$PATH
COPY client /usr/src/petclinic-frontend/client
WORKDIR /usr/src/petclinic-frontend/client
RUN npm install -g npm@5.6.0
RUN npm install --unsafe-perm
RUN npm run build:prod

ENV NODE_ENV=production
COPY server /usr/src/petclinic-frontend/server
WORKDIR /usr/src/petclinic-frontend/server
ENV PATH /usr/src/petclinic-frontend/server/node_modules/.bin:$PATH
RUN npm install
RUN cp /usr/src/petclinic-frontend/client/dist/index.* /usr/src/petclinic-frontend/server/public/
RUN cp -R /usr/src/petclinic-frontend/client/dist/public/ /usr/src/petclinic-frontend/server/public/

RUN mkdir /source_maps
RUN cp /usr/src/petclinic-frontend/client/dist/index.js.map /source_maps/index.js.map

COPY entrypoint.sh /etc/entrypoint.sh

ENV NODE_ENV production
EXPOSE 3000
CMD ["npm","start"]
ENTRYPOINT ["/bin/bash", "/etc/entrypoint.sh"]
