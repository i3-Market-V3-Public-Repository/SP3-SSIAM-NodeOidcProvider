import * as express from 'express'
// import { middleware as openapiValidator } from 'express-openapi-validator'
import * as swaggerUI from 'swagger-ui-express'
import * as openapiSpec from './api.json'

export const openapiUi = async (): Promise<express.Router> => {
  const router = express.Router()
  router.use('/ui', swaggerUI.serve, swaggerUI.setup(openapiSpec))
  router.get('/openapi.json', (req: express.Request, res: express.Response) => {
    res.json(openapiSpec)
  })
  return router
}
