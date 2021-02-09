import * as path from 'path'
import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as http from 'http'
import * as ngrok from 'ngrok'

import config from './config'
import logger, { loggerMiddleware } from './logger'
import Adapter from './adapter'
import { addEndpoint } from './endpoint'
import WebSocketServer from './ws'

import { oidcEndpoint, interactionEndpoint, rpEndpoint, apiSpecEndpoint } from './routes'

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
  // Connect adapter to database if needed
  if (Adapter.connect != null) {
    await Adapter.connect()
  }

  // Initialize express
  const app = express()
  const server = http.createServer(app)
  const wss = new WebSocketServer(server)

  // View
  app.set('views', path.join(__dirname, 'views'))
  app.set('view engine', 'ejs')
  app.use(bodyParser.json())

  // Add middlewares
  app.use(loggerMiddleware)

  /**
   * TODO:
   * Force proto https if reverse proxy. Header x-forwarded-proto must be setted by the proxy
   * Only use this option on development enviromnent!
   */
  if (config.revereProxy && !config.isProd) {
    logger.warn('Setting up x-forwarded-proto header as https. Note that it should be only used in development!')
    app.use((req, res, next) => {
      req.headers['x-forwarded-proto'] = 'https'
      next()
    })
  }

  // Add endpoints
  addEndpoint(app, wss, '/api-spec', await apiSpecEndpoint(app, wss))
  addEndpoint(app, wss, '/oidc', await oidcEndpoint(app, wss))
  addEndpoint(app, wss, '/interaction', await interactionEndpoint(app, wss))
  addEndpoint(app, wss, '/rp', await rpEndpoint(app, wss))

  // Add static files (css and js)
  const publicDir = path.resolve(__dirname, 'public')
  app.use('/', express.static(publicDir))

  // Listen
  const port = config.port
  await listenPromise(server, port)

  // Connect to ngrok
  let url = `http://localhost:${port}`
  if (config.useNgrok) {
    url = await ngrok.connect({ addr: port })
  }

  // Log connection information
  logger.info(`Application is listening on port ${config.port}`)
  logger.info(`OIDC Provider Discovery endpoint at ${url}/oidc/.well-known/openid-configuration`)
  logger.info(`OpenAPI JSON spec at ${url}/api-spec/openapi.json`)
  logger.info(`OpenAPI browsable spec at ${url}/api-spec/ui`)
}

export function onError (reason: Error): void {
  logger.error(`Error ${reason.message}`)
}
