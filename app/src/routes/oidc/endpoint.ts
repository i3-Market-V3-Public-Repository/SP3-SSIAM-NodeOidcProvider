import { Router } from 'express'

import { EndpointLoader } from '@i3-market/endpoint'

import Provider from './provider'

const endpoint: EndpointLoader = async () => {
  const appRouter = Router()

  // appRouter.use('/api-spec', await openapiUi())

  const provider = await Provider()
  appRouter.use('/', provider.callback)

  return { appRouter }
}

export default endpoint
