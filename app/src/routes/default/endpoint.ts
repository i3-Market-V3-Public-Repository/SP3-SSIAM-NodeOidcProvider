import { Router } from 'express'

import { EndpointLoader } from '@i3-market/endpoint'

const endpoint: EndpointLoader = async () => {
  const appRouter = Router()

  // Setup app routes
  appRouter.get('/', function (req, res) {
    res.redirect('/api-spec/ui')
  })

  return { appRouter }
}

/// ///////

export default endpoint
