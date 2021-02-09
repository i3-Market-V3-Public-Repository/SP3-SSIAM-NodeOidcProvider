import { RequestHandler, Router as AppRouter, urlencoded } from 'express'

import { EndpointLoader } from '@i3-market/endpoint'

import { getProvider } from '../oidc'
import Controller from './controller'

//
function nextIfError<A, B, C, D> (handler: RequestHandler<A, B, C, D>): RequestHandler<A, B, C, D> {
  return async (req, res, next) => {
    await (handler(req, res, next) as any).catch(next)
  }
}

const setNoCache: RequestHandler = (req, res, next) => {
  res.set('Pragma', 'no-cache')
  res.set('Cache-Control', 'no-cache, no-store')
  next()
}

const endpoint: EndpointLoader = async (app, wss) => {
  const appRouter = AppRouter()
  const provider = await getProvider()
  const controller = new Controller(provider)
  const body = urlencoded({ extended: false })

  // Wait controller initialization
  await controller.initialize()

  // Setup app routes
  appRouter.post('/:clientId', setNoCache, body, nextIfError(controller.newClient))

  // Handle errors
  appRouter.use(controller.onError)

  return { appRouter }
}

/// ///////

export default endpoint
