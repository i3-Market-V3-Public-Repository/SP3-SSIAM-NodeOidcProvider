FROM node:14 AS builder

WORKDIR /app
COPY ./app /app

RUN npm i && npm run build

FROM node:14
COPY --from=builder /app/dist /app/dist
COPY ./production.env ./docker-compose.yaml ./app/package.json ./app/package-lock.json ./app/.npmrc /app/
COPY ./docker/template ./docker/entrypoint ./docker/init-volumes /usr/local/bin/
COPY ./app/misc/whitelist.js /app/default/misc/
COPY ./db/ /app/default/
COPY ./app/misc/identity.json /app/misc/
COPY ./app/misc/jwks.json /app/misc/

WORKDIR /app
RUN npm i --only=prod

EXPOSE 3300

CMD ["entrypoint"]
