FROM node:14 AS builder

WORKDIR /app
COPY ./app /app

RUN npm i && npm run build

FROM node:14
COPY --from=builder /app/dist /app/dist
COPY ./app/package-lock.json /app/
COPY ./app/package.json /app/
COPY ./app/misc/whitelist.js /app/misc/whitelist.js

WORKDIR /app
RUN npm i --only=prod

EXPOSE 3000

CMD ["npm", "run", "run:prod"]
