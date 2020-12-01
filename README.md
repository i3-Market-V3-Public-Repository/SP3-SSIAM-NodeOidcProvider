# i3-Market OpenID Provider

An OpenID Provider for i3-Market.

## Production

To build the typescript and prepare copy all the needed files into the build folder execute the command:

```bash
npm run build
```

To build a docker image use the command:

```bash
# The image that will be used with the docker-compose file
npm run docker

# Or build it yourselve
docker build . -t i3-market-oidc-provider
```

## Configuration

To configure the server use the following environmental variables:

```bash
# Environment configuration
NODE_ENV=development # or production

# Server configuration
OIDC_PROVIDER_ISSUER=http://localhost:3000
OIDC_PROVIDER_PORT=3000

# Security configuration
## Many passwords can be used (comma-separated)
COOKIES_KEYS=gqmYWsfP6Dc6wk6J,Xdmqh4JBDuAc43xt,8WxYvAGmPuEvU8Ap
JWKS_KEYS_PATH=./misc/jwks.json

# Database configuration
OIDC_PROVIDER_DB_HOST=mongo.example.com
OIDC_PROVIDER_DB_PORT=27017
OIDC_PROVIDER_DB_USERNAME=someone
OIDC_PROVIDER_DB_PASSWORD=a-password
OIDC_PROVIDER_DB_DATABASE=mydb

# Reverse proxy. More info about how to configure te reverse proxy on:
# https://github.com/panva/node-oidc-provider/blob/master/docs/README.md#trusting-tls-offloading-proxies
OIDC_PROVIDER_REVERSE_PROXY=false
```

## Development

There is also a development launch command. It uses *ts-node* and *nodemon* to directly execute the source code and refresh the server if any file has changed. The OAS documentation can be accessed on [localhost:3000/oidc/docs](http://localhost:3000/oidc/docs).

The shortcut command is:

```bash
npm run run:dev
```

The *oidc-provider* needs a *mongo* database to work, so we provide a preconfigured docker compose service. To execute it use the command:

```bash
# Just execute
docker-compose up -d db

# Execution + Initialization
#  - It will check if the database is already initialized
#  - The initial values for clients and accounts are placed in db/scripts/initial-state.js
docker-compose up -d db-initialize
```

To perform more complex manual tests, we also provide a docker compose service so different images are connected in the same network.

```bash
# Launch a image using the current source files
docker-compose up -d oidc-provider-dev

# Lauch a keycloak image
docker-compose up -d keycloak

# Launch a test Relying Party
docker-compose up -d oidc-rp

# This service registers all the services in the host's host file
#  - Needed for the OpenID standard redirections when using OpenID Connect Discovery
#    (https://openid.net/specs/openid-connect-discovery-1_0.html)
#  - NOTE: Only working on linux
docker-compose up -d resolver
```

There are an environment example and database initial state files. To start a development environment copy them:

```bash
cd misc
cp template.dev dev.env
cp initial-state.template.js initial-state.js
```
