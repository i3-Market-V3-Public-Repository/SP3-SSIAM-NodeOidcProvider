FROM node:lts

# Configure default values

## Mongo default configuration
ENV MONGO_HOST localhost
ENV MONGO_INITDB_ROOT_USERNAME oidp
ENV MONGO_INITDB_ROOT_PASSWORD secret
ENV MONGO_INITDB_DATABASE oidp

# Create app directory
WORKDIR /usr/src/app

# Install
COPY ./build /usr/src/app
COPY ./package.json /usr/src/app
COPY ./package-lock.json /usr/src/app

RUN npm i --only=prod

# Configure entrypoint
CMD node ./src

EXPOSE 3000
