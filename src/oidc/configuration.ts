import { loadJSON } from "../util"
import { Configuration } from "oidc-provider"

import config from "../config"
import interactions from "./interactions"
import Account from "../account"


export default async (): Promise<Configuration> => {
    const keys = await loadJSON(config.jwksKeysPath)
    if(!keys) {
        console.error("JWKS file not fount")
    }

    return {
        findAccount: Account.findAccount,
        interactions,

        // TODO: Implement this function to add custom error views
        // renderError: async (ctx, out, error) => {
        //   return
        // },

        claims: {
            openid: ['sub', 'profile']
        },
        jwks: { keys },

        features: {
            devInteractions: { enabled: false },

            introspection: { enabled: true },
            revocation: { enabled: true },
        },

        cookies: {
            long: { signed: true, maxAge: (1 * 24 * 60 * 60) * 1000 }, // 1 day in ms
            short: { signed: true },
            keys: config.cookiesKeys,
        },

        ttl: {
            AccessToken: 1 * 60 * 60, // 1 hour in seconds
            AuthorizationCode: 10 * 60, // 10 minutes in seconds
            IdToken: 1 * 60 * 60, // 1 hour in seconds
            DeviceCode: 10 * 60, // 10 minutes in seconds
            RefreshToken: 1 * 24 * 60 * 60, // 1 day in seconds
        }
    }
}
