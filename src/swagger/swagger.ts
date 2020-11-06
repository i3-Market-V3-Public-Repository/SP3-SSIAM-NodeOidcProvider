import * as express from 'express'
import { Router } from 'express'
// import { middleware as openapiValidator } from 'express-openapi-validator'
import * as swaggerUI from 'swagger-ui-express'

import { loadYAML } from "../util"


export const initSwaggerMiddlware = async (
    app: express.Express,
    basePath: string
) => {
    const swaggerDoc = await loadYAML(basePath + '/oidc/swagger.yaml')
    // const validatorMiddleware = openapiValidator({
    //     apiSpec: swaggerDoc,
    //     operationHandlers: basePath + '/routes',
    //     validateRequests: true, // (default)
    //     validateResponses: true, // false by default,
    //     validateFormats: 'full'
    // })

    // app.use(validatorMiddleware)
    app.use('/oidc-docs', swaggerUI.serve, swaggerUI.setup(swaggerDoc))
}

export const documentation = async (swaggerDocPath: string) => {
    const router = Router()
    const swaggerDoc = await loadYAML(swaggerDocPath)
    router.use('/', swaggerUI.serve, swaggerUI.setup(swaggerDoc))

    return router
}
