# i3-Market OpenID Provider

An OpenID Provider for i3-Market.

## Install
Clone the repository with

```console 
$ git clone git@gitlab.com:i3-market/code/wp3/t3.1-self-sovereign-identity-and-access-management/node-oidc-provider.git
$ cd node-oidc-provider
```

## Development

A just-working version using a mongodb initialized with the content in `db/scripts/mongo-init.js`. Update to your needs!

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

Besides rebuilding, you can execute any command in the `oidc-provider-app` container:

- to execute it in the running container:

    ```console
    docker-compose -f docker-compose.dev.yaml exec oidc-provider-app <command>
    ```

- to create and delete on-the-fly a new container (that will update the same files):

    ```console
    docker-compose -f docker-compose.dev.yaml run --rm --no-deps oidc-provider-app <command>
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

## Relying Party configuration

### Scope

This OIDC Provider has the following static scopes:

 - **openid**: Mandatory for the OpenID Connect standard. It returns the *sub* field of the *id_token*, and its value is the user did.
 - **profile**: It adds information about the user profile into the *id_token*.
 - **vc**: It adds the field *verifiable_claims* into the *id_token*. Useful when the RP wants to check any information about the verifiable claims asked.

There are several automatic scopes.

 - **vc:{vc_name}**: It asks the user for the specific verifiable claim *vc_name*. It is optional, so the user can decide whether to append it or not. If the issuer of the verifiable claim is not trusted, it will be added into untrusted verifiable claims array.
 - **vce:{vc_name}**: It asks the user for the essential verifiable claim with name: *vc_name*. It is mandatory, so if the user doesn't provide it, or the issuer is untrusted, the login and consent process will be cancelled.

### Tokens

When the authorization and authentication process finishes, two tokens are returned: *access_token* and *id_token*.

- Both tokens have the following fields:
  - **sub**: identity (user) did.
  - **aud**: audience (who or what the token is intended for).
  - **exp**: expiration date.
  - **iat**: issued at.
  - **iss**: token issuer. It is always the OIDC Provider.

- **access_token**: it can be used to prove that the user consents access for a specific scope. 
  - **scope**: space separated scopes that the user has proved to fulfill.

  Following example shows a raw and decoded *access_token*:

```text
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InIxTGtiQm8zOTI1UmIyWkZGckt5VTNNVmV4OVQyODE3S3gwdmJpNmlfS2MifQ.eyJqdGkiOiJKcmcwcEpFdHY2Z1Z2SDZxOENfU1QiLCJzdWIiOiJkaWQ6ZXRocjoweGY2YTJiZTM3YTc5OGYyMTY3NzNjYmU0NWNlOWMwODc3NmViMjZiYjMiLCJpYXQiOjE2MTIxNzEwMTUsImV4cCI6MTYxMjE3NDYxNSwic2NvcGUiOiJvcGVuaWQgdmMgdmNlOmNvbnN1bWVyIiwiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6MzAwMCIsImF1ZCI6Im9pZGNDTElFTlQifQ.eiRDwuYtYUprL4rbILlEHO58Jc7whyh6mhXIFss6zv3rM_hpBj9YTBRgOg1CDFz866cdZ-vIl3Bo-PlqQV9BHRIvFwvknbLfNSxBXn_VB9il8lrQ49Aury71nQmkFgYC6zeWaBbRRsp8I0xCra3GkAaA3MXR_XwJDfv1AcR8Ifu-LKYFSHXImwVEmwUmgCpVgLqTiJY2mxFnKkaqaSYOr44ZFoU5CADoegkt4SUV3bpYy2kLrDK-BItj2GFxS_5fguy1EYR6R8Zx6pj0VXPYh207_NT23EHzf0UFCzHJXGg5Aw8YWZO6vlo-mqKxw2XybTei2XyBLujNizTTjQ2oKA
```

```json
{
  "jti": "Jrg0pJEtv6gVvH6q8C_ST",
  "sub": "did:ethr:0xf6a2be37a798f216773cbe45ce9c08776eb26bb3",
  "iat": 1612171015,
  "exp": 1612174615,
  "scope": "openid vc vce:consumer",
  "iss": "https://localhost:3000",
  "aud": "oidcCLIENT"
}
```

- **id_token**: it contains information about the identity. Specific fields:
  - **verifiable_claims**: arrays of trusted and untrusted verifiable claims.

  Following example shows a raw and decoded *id_token*:

```text
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InIxTGtiQm8zOTI1UmIyWkZGckt5VTNNVmV4OVQyODE3S3gwdmJpNmlfS2MifQ.eyJzdWIiOiJkaWQ6ZXRocjoweGY2YTJiZTM3YTc5OGYyMTY3NzNjYmU0NWNlOWMwODc3NmViMjZiYjMiLCJ2ZXJpZmllZF9jbGFpbXMiOnsidHJ1c3RlZCI6W3siaWF0IjoxNjExNTcyMjUxLCJleHAiOjE2MTQxNjQyNTEsInN1YiI6ImRpZDpldGhyOjB4ZjZhMmJlMzdhNzk4ZjIxNjc3M2NiZTQ1Y2U5YzA4Nzc2ZWIyNmJiMyIsImNsYWltIjp7ImNvbnN1bWVyIjp0cnVlfSwiaXNzIjoiZGlkOmV0aHI6MHhlNmYyYmU4MGVkNTUyMTUyOWY2N2IzOWE3NGFhNDI4MjgyY2YwMzEyIiwiand0IjoiZXlKMGVYQWlPaUpLVjFRaUxDSmhiR2NpT2lKRlV6STFOa3N0VWlKOS5leUpwWVhRaU9qRTJNVEUxTnpJeU5URXNJbVY0Y0NJNk1UWXhOREUyTkRJMU1Td2ljM1ZpSWpvaVpHbGtPbVYwYUhJNk1IaG1ObUV5WW1Vek4yRTNPVGhtTWpFMk56Y3pZMkpsTkRWalpUbGpNRGczTnpabFlqSTJZbUl6SWl3aVkyeGhhVzBpT25zaVkyOXVjM1Z0WlhJaU9uUnlkV1Y5TENKcGMzTWlPaUprYVdRNlpYUm9jam93ZUdVMlpqSmlaVGd3WldRMU5USXhOVEk1WmpZM1lqTTVZVGMwWVdFME1qZ3lPREpqWmpBek1USWlmUS5acFYwM3VjOXJyNWxCVGZJcW5hbDlsT2k4alFXNTZrc3VaRE90UEtLWEowWmdwZC03dGQ3ZVExUGVjdUNoWF9sdXhrR1gzb3ZlM3FtRXAtcWVJRnRpZ0EifV0sInVudHJ1c3RlZCI6W119LCJhdF9oYXNoIjoieVpnaHBkaTBTRUJTZGJwT05QRTI3QSIsImF1ZCI6Im9pZGNDTElFTlQiLCJleHAiOjE2MTIxNzQ2MTUsImlhdCI6MTYxMjE3MTAxNSwiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6MzAwMCJ9.JHhZ-A7ephdD0nyXKsBGrltWFwPZpeqJID9MbN7b164S5yYOfcrgVeNjyE_-9sJZEU8EEUhFjj3FjC6maF-MZBiqXO7QTFsVfds8gDRmLHCSXhyp0SvSPywzbqHB4KE6hBgLo5yuZ9Q1dv0bUr7btis8-9Uc7FmeIg7BmTPDB89c_CKZfdRUkcmYcW8EWsH9RNl9XQGXAYqZfQZnJoKmkILScnIUuq3p38qNpL2VrnvhWXfKx3IXA3bCazWeHeToNoPcrQdUJTFkfxo2vAQXXrnNEWOrE_UwDnv3rORMdsaGZTB47MzL5YFVG5f0PsNzRwXnhQ1b7ZP6yze1fC0pww
```

```json
{
  "sub": "did:ethr:0xf6a2be37a798f216773cbe45ce9c08776eb26bb3",
  "verified_claims": {
    "trusted": [
      {
        "iat": 1611572251,
        "exp": 1614164251,
        "sub": "did:ethr:0xf6a2be37a798f216773cbe45ce9c08776eb26bb3",
        "claim": {
          "consumer": true
        },
        "iss": "did:ethr:0xe6f2be80ed5521529f67b39a74aa428282cf0312",
        "jwt": "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE2MTE1NzIyNTEsImV4cCI6MTYxNDE2NDI1MSwic3ViIjoiZGlkOmV0aHI6MHhmNmEyYmUzN2E3OThmMjE2NzczY2JlNDVjZTljMDg3NzZlYjI2YmIzIiwiY2xhaW0iOnsiY29uc3VtZXIiOnRydWV9LCJpc3MiOiJkaWQ6ZXRocjoweGU2ZjJiZTgwZWQ1NTIxNTI5ZjY3YjM5YTc0YWE0MjgyODJjZjAzMTIifQ.ZpV03uc9rr5lBTfIqnal9lOi8jQW56ksuZDOtPKKXJ0Zgpd-7td7eQ1PecuChX_luxkGX3ove3qmEp-qeIFtigA"
      }
    ],
    "untrusted": []
  },
  "at_hash": "yZghpdi0SEBSdbpONPE27A",
  "aud": "oidcCLIENT",
  "exp": 1612174615,
  "iat": 1612171015,
  "iss": "https://localhost:3000"
}
```

## TODO

Add to the Readme:

1. How to install OIDC Provider on a server
2. How to connect using a standard OIDC library
3. How to register clients for the demo
