import { Configuration, errors } from 'oidc-provider'

import config from '@i3-market/config'
import Account from '@i3-market/account'

import keys from './keys'
import interactions from './interactions'
import logger from '@i3-market/logger'

export default async (): Promise<Configuration> => {
  return {
    findAccount: Account.findAccount,
    interactions: await interactions(),

    // TODO: Implement this function to add custom error views
    renderError: async (ctx, out, error: errors.OIDCProviderError) => {
      logger.error(`${error.message}: ${error.error_description ?? ''}\n${error.stack ?? ''}`)
      throw error
    },

    pkce: {
      methods: ['S256'],
      required: (ctx, client) => {
        return client.tokenEndpointAuthMethod === 'none'
      }
    },

    // TODO: Chek if this function can be used to notify with optional vc are not sent/untrusted
    extraAccessTokenClaims: (ctx, token) => {

    },

    expiresWithSession (ctx, token) {
      return true
    },

    formats: {
      AccessToken: 'jwt'
    },

    clientDefaults: {
      grant_types: [
        'authorization_code'
      ],
      // id_token_signed_response_alg: 'ES256',
      response_types: [
        'code'
      ],
      token_endpoint_auth_method: 'client_secret_jwt'
    },

    scopes: ['openid', 'vc', 'vc:*', 'vce:*'],
    claims: {
      openid: ['sub'],
      vc: ['verified_claims']
    },
    // TODO: Buscar informacion para pedir individual claims
    dynamicScopes: [
      /^vc:(.+)$/,
      /^vce:(.+)$/
    ],
    jwks: {
      keys: await keys()
    },

    features: {
      claimsParameter: { enabled: true },
      devInteractions: { enabled: false },

      introspection: { enabled: true },
      revocation: { enabled: true },

      // Disable this to append
      userinfo: { enabled: false },
      jwtUserinfo: { enabled: false }
    },

    cookies: {
      long: { signed: true, maxAge: (1 * 24 * 60 * 60) * 1000 }, // 1 day in ms
      short: { signed: true },
      keys: config.cookiesKeys
    },

    ttl: {
      AccessToken: 1 * 60 * 60, // 1 hour in seconds
      AuthorizationCode: 10 * 60, // 10 minutes in seconds
      IdToken: 1 * 60 * 60, // 1 hour in seconds
      DeviceCode: 10 * 60, // 10 minutes in seconds
      RefreshToken: 1 * 24 * 60 * 60 // 1 day in seconds
    }
  }
}
