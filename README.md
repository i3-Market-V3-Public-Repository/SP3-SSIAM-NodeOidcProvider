# i3-Market OpenID Provider

An OpenID Provider for i3-Market.

## Development

A just-working version using a mongodb initialized with the content in `db/scripts/mongo-init.js`. Update to your needs!

### Install
Clone the repository with

```console 
$ git clone git@gitlab.com:i3-market/code/wp3/t3.1-self-sovereign-identity-and-access-management/node-oidc-provider.git
$ cd node-oidc-provider
```

### Usage

Run the following command in the project root. The first time it will take a while (be patience), since it has to build images and download all the npn dependencies.

```console
./docker-dev-start
```

The OAS documentation can be accessed on [http://localhost:3000/oidc/api-spec/ui](http://localhost:3000/oidc/api-spec/ui).

You can stop the container at any time with `Ctrl-C`.

If you want to delete and prune all the created images, containers, networks, volumes, just run

```console
./docker-dev-prune
```

Since the `app` directory is shared with the docker container with mapped user permissions, you can just edit any files in the `app` directory locally. The container will be running `ts-node` and `nodemon` to directly execute the source code and refresh the server if any file has changed. You can also attach any debugger in your local machine to the container, which will be listening at default port 9229.

#### Development scripts

Besides rebuilding, you can execute any command in the `cloud-wallet-server` container:

- to execute it in the running container:

    ```console
    docker-compose exec cloud-wallet-server <command>
    ```

- to create and delete on-the-fly a new container (that will update the same files):

    ```console
    docker-compose run --rm --no-deps cloud-wallet-server <command>
    ```

Since `npm` and `node` are likely to be needed, if your OS allows you to execute shell scripts, you can just also use the `npm` and `node` scripts provided for convenience.

```console
$ ./npm -v
6.14.8
$ ./node -v
v14.15.1
```

## Production

To build the typescript and prepare copy all the needed files into the build folder execute the command:

```console
npm run build
```

To build a docker image use the command:

```console
docker build . -t i3-market-oidc-provider
```

### Configuration

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

## Additional testing

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
