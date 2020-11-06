import { Router } from "express"
import * as path from "path"

import Provider from "./provider"
import { documentation } from "../swagger"


export default async () => {
    const router = Router()

    const oidcDocumentation = await documentation(path.resolve(__dirname, "swagger.yaml"))
    router.use("/docs", oidcDocumentation)

    const provider = await Provider()
    router.use("/", provider.callback)

    return router
}
