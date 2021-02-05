import * as express from 'express'
import { middleware as openapiValidator } from 'express-openapi-validator'
import * as swaggerUI from 'swagger-ui-express'

import { EndpointLoader } from '@i3-market/endpoint'
import config from '@i3-market/config'

import * as openapiSpec from './api.json'
import { errorMiddleware } from './error-middleware'

const endpoint: EndpointLoader = async (app) => {
  const router = express.Router()
  router.use('/ui', swaggerUI.serve, swaggerUI.setup(openapiSpec))
  router.get('/openapi.json', (req: express.Request, res: express.Response) => {
    res.json(openapiSpec)
  })

  app.use(
    openapiValidator({
      apiSpec: openapiSpec as any,
      validateResponses: !config.isProd, // <-- to validate responses
      validateRequests: true, // false by default
      // unknownFormats: ['my-format'] // <-- to provide custom formats
      ignorePaths: /^(?!\/?rp).*$/
    })
  )
  app.use(errorMiddleware)

  return { appRouter: router }
}

export default endpoint
