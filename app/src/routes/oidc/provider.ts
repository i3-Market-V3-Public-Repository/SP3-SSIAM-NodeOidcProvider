import { Provider } from 'oidc-provider'
import { set } from 'lodash'

import Adapter from '@i3-market/adapter'
import config from '@i3-market/config'
import logger from '@i3-market/logger'

import configuration from './configuration'

let provider: Provider | undefined
export default async (): Promise<Provider> => {
  if (provider !== undefined) return provider
  const baseOIDCConfig = await configuration()

  if (config.isProd) {
    set(baseOIDCConfig, 'cookies.short.secure', true)
    set(baseOIDCConfig, 'cookies.long.secure', true)
  }

  provider = new Provider(config.issuer, { adapter: Adapter, ...baseOIDCConfig })
  if (config.revereProxy) {
    logger.debug('Enabling reverse proxy')
    provider.proxy = true
  }

  return provider
}
