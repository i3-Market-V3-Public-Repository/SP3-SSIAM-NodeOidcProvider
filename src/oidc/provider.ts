import { Provider } from "oidc-provider"
import { set } from "lodash"

import Adapter from "../adapter"
import config from "../config"
import configuration from "./configuration"


let provider: Provider | undefined
export default async () => {
    if (provider) return provider
    const baseOIDCConfig = await configuration()

    if (config.isProd) {
        set(baseOIDCConfig, 'cookies.short.secure', true)
        set(baseOIDCConfig, 'cookies.long.secure', true)
    }

    provider = new Provider(config.issuer, {adapter: Adapter, ...baseOIDCConfig})
    return provider
}
