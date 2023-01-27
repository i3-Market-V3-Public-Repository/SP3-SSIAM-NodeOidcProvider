FROM node:18-slim AS builder 

WORKDIR /app
COPY ./app /app

RUN npm i && npm run build

FROM builder
COPY --from=builder /app/dist /app/dist
COPY ./.env.oidc ./docker-compose.yaml ./app/package.json ./app/package-lock.json /app/
COPY ./docker/template ./docker/entrypoint ./docker/init-volumes /usr/local/bin/
COPY ./app/misc/whitelist.js /app/default/misc/
COPY ./db/ /app/default/

WORKDIR /app
RUN npm i --only=prod

EXPOSE 3300

CMD ["entrypoint"]
