import * as express from "express"
import * as path from "path"

import config from "./config"
import interactionRouter from "./interaction"
import logger, { loggerMiddleware } from "./logger"
import oidcRouter from "./oidc"
import Adapter from "./adapter"

main().catch(onError)

//////////

async function main() {
    // Connect adapter to database if needed
    if (Adapter.connect) {
        await Adapter.connect()
    }

    // Initialize express
    const app = express()

    // View
    app.set('views', path.join(__dirname, 'views'))
    app.set('view engine', 'ejs')

    // Add middlewares
    app.use(loggerMiddleware)

    // Add routers
    app.use("/interaction", await interactionRouter(app))
    app.use("/oidc", await oidcRouter())

    // Listen
    app.listen(config.port, () => {
        logger.info(`Application is listening on port ${config.port}, check its /.well-known/openid-configuration`)
    })
}

function onError(reason: Error) {
    console.error(`Error ${reason}`)
}
