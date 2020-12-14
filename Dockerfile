FROM node:14

## Mongo default configuration
ENV MONGO_HOST localhost
ENV MONGO_INITDB_ROOT_USERNAME oidp
ENV MONGO_INITDB_ROOT_PASSWORD secret
ENV MONGO_INITDB_DATABASE oidp

WORKDIR /app
COPY ./app/build /app/
RUN npm i --only=prod

EXPOSE 3000

CMD ["node", "src/index.js"]
