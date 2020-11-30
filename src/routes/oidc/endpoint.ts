import { Router } from "express"
import * as path from "path"

import { documentation } from "@i3-market/swagger"
import { EndpointLoader } from "@i3-market/endpoint"

import Provider from "./provider"


const endpoint: EndpointLoader = async () => {
    const appRouter = Router()

    const oidcDocumentation = await documentation(path.resolve(__dirname, "swagger.yaml"))
    appRouter.use("/docs", oidcDocumentation)

    const provider = await Provider()
    appRouter.use("/", provider.callback)

    return { appRouter }
}


export default endpoint
