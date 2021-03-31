FROM node:14 AS builder

WORKDIR /app
COPY ./app /app

RUN npm i && npm run build

FROM node:14
COPY --from=builder /app/dist /app/dist
COPY ./production.env ./docker-compose.yaml ./app/package.json ./app/package-lock.json /app/
COPY ./docker/template ./docker/entrypoint ./docker/init-volumes /usr/local/bin/
COPY ./app/misc/whitelist.js /app/default/misc/
COPY ./db/ /app/default/

WORKDIR /app
RUN npm i --only=prod

EXPOSE 3000

CMD ["entrypoint"]
