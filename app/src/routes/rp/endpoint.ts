import { Router as AppRouter } from 'express'

import { EndpointLoader } from '@i3-market/endpoint'

import { getProvider } from '../oidc'
import Controller from './controller'
import passport from 'passport'

const endpoint: EndpointLoader = async (app, wss) => {
  const appRouter = AppRouter()
  const provider = await getProvider()
  const controller = new Controller(provider)

  // Wait controller initialization
  await controller.initialize()

  // Setup app routes
  appRouter.post('/:clientId', passport.authenticate('basic', { session: false }), controller.newClient)

  // Handle errors
  appRouter.use(controller.onError)

  return { appRouter }
}

/// ///////

export default endpoint
