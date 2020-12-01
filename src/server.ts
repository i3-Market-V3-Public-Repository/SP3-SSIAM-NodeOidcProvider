import * as path from "path"
import * as express from "express"
import * as bodyParser from "body-parser"
import * as http from "http"

import config from "./config"
import logger, { loggerMiddleware } from "./logger"
import Adapter from "./adapter"
import { addEndpoint } from "./endpoint"
import WebSocketServer from "./ws"

import { oidcEndpoint, interactionEndpoint } from "./routes"

//////////

function listenPromise(server: http.Server, port: number) {
    return new Promise((resolve) => server.listen(port, () => {
        resolve()
    }))
}

/**
 * Main function: the application entrypoint!
 */
export async function main() {
    // Connect adapter to database if needed
    if (Adapter.connect) {
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
    if(config.revereProxy && !config.isProd) {
        app.use((req, res, next) => {
            req.headers['x-forwarded-proto'] = 'https'
            next()
        })
    }

    // Add endpoints
    addEndpoint(app, wss, "/oidc", await oidcEndpoint(app, wss))
    addEndpoint(app, wss, "/interaction", await interactionEndpoint(app, wss))

    // Add static files (css and js)
    const publicDir = path.resolve(__dirname, "public")
    app.use('/', express.static(publicDir))

    // Listen
    const port = config.port
    const url = `http://localhost:${port}`
    await listenPromise(server, port)

    // Log connection information
    logger.info(`Application is listening on ${url}`)
    logger.info(`Check ${url}/oidc/docs for more information`)
}

export function onError(reason: Error) {
    console.error(`Error ${reason}`)
}
