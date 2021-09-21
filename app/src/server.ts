import * as path from 'path'
import express from 'express'
import * as http from 'http'
import { URL } from 'url'

import config from './config'
import logger, { loggerMiddleware } from './logger'
import Adapter from './adapter'
import { addEndpoint } from './endpoint'
import WebSocketServer from './ws'
import passportPromise from './passport'
import { jwks, did } from './security'

import { defaultEndpoint, oidcEndpoint, interactionEndpoint, apiSpecEndpoint } from './routes'

/// ///////

async function listenPromise (server: http.Server, port: number): Promise<void> {
  return await new Promise((resolve) => server.listen(port, () => {
    resolve()
  }))
}

/**
 * Main function: the application entrypoint!
 */
export async function main (): Promise<void> {
  if (config.isProd) {
    logger.info('Using production environment')
  }

  // Connect adapter to database if needed
  if (Adapter.connect != null) {
    await Adapter.connect()
  }

  const port = config.port

  // Connect to ngrok
  if (config.isProd && config.useNgrok) {
    throw new Error('You can\'t use NGROK in production. You may want to switch it off in your .env file')
  }
  if (config.useNgrok) {
    const ngrok = await import('ngrok')
    const ngrokUri = await ngrok.connect({ addr: port })
    config.ngrokUri = ngrokUri
  }

  // Initialise server comunications variables
  const publicUri = config.publicUri
  const url = new URL(publicUri)
  config.host = url.host

  // Intialize jwks
  await jwks({ keys: ['RS256', 'PS256', 'ES256', 'EdDSA'] })

  // Create a new identity if not provided
  await did()

  // Initialize express
  const app = express()
  const server = http.createServer(app)
  const wss = new WebSocketServer(server)
  const passport = await passportPromise()

  // View
  app.set('views', path.join(__dirname, 'views'))
  app.set('view engine', 'ejs')
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))
  app.use(passport.initialize())

  // Add middlewares
  app.use(loggerMiddleware)

  /**
   * TODO:
   * Force proto https if reverse proxy. Header x-forwarded-proto must be setted by the proxy
   * Only use this option on development enviromnent!
   */
  if (config.reverseProxy && !config.isProd) {
    logger.warn('Setting up x-forwarded-proto header as https. Note that it should be only used in development!')
    app.use((req, res, next) => {
      req.headers['x-forwarded-proto'] = 'https'
      // req.headers['x-forwarded-for'] = 'oidc.i3m.gold.upc.edu'
      req.headers.host = config.host
      next()
    })
  }

  // Add endpoints
  addEndpoint(app, wss, '/release2/', await defaultEndpoint(app, wss))
  addEndpoint(app, wss, '/release2/api-spec', await apiSpecEndpoint(app, wss))
  addEndpoint(app, wss, '/release2/oidc', await oidcEndpoint(app, wss))
  addEndpoint(app, wss, '/release2/interaction', await interactionEndpoint(app, wss))
  // addEndpoint(app, wss, '/credential', await credentialEndpoint(app, wss))
  // addEndpoint(app, wss, '/did', await didEndpoint(app, wss))
  // addEndpoint(app, wss, '/developers', await developersEndpoint(app, wss))

  // Add static files (css and js)
  const publicDir = path.resolve(__dirname, 'public')
  app.use('/', express.static(publicDir))

  // Listen
  await listenPromise(server, port)

  // Log connection information
  logger.info(`Application is listening on port ${config.port}`)
  logger.info(`OIDC Provider Discovery endpoint at ${publicUri}/oidc/.well-known/openid-configuration`)
  logger.info(`OpenAPI JSON spec at ${publicUri}/api-spec/openapi.json`)
  logger.info(`OpenAPI browsable spec at ${publicUri}/api-spec/ui`)
}

export function onError (reason?: Error): void {
  logger.error(`Error ${reason !== undefined ? reason?.message : 'unknown'}`)
  if (reason !== undefined) {
    console.log(reason)
  }
}
