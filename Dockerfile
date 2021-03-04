FROM node:14.16.0-alpine3.10
RUN mkdir -p /app/node_modules && chown -R node:node /app/
WORKDIR /app
COPY package*.json .
USER node
RUN npm install
COPY --chown=node:node . .
EXPOSE 80
CMD [ "npm", "start" ]
