import { Router as AppRouter } from 'express'

import { EndpointLoader } from '@i3-market/endpoint'

import { getProvider } from '../oidc'
import Controller from './controller'
import passportPromise from '@i3-market/passport'

const endpoint: EndpointLoader = async (app, wss) => {
  const appRouter = AppRouter()
  const provider = await getProvider()
  const controller = new Controller(provider)

  // Wait controller initialization
  await controller.initialize()

  const passport = await passportPromise()

  // Setup app routes
  appRouter.get('/login', passport.authenticate('basic', { session: false }), controller.login)

  // Handle errors
  appRouter.use(controller.onError)

  return { appRouter }
}

/// ///////

export default endpoint
