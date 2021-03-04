import { RequestHandler, Router as AppRouter } from 'express'

import { WebSocketRouter } from '../../ws'
import { EndpointLoader } from '../../endpoint'
import InteractionController from './controller'
import { getProvider } from '../oidc'
import passportPromise from '@i3-market/passport'

function nextIfError (handler: RequestHandler): RequestHandler {
  return async (req, res, next) => {
    await (handler(req, res, next) as any).catch((err) => {
      console.trace(err)
      next(err)
    })
  }
}

const setNoCache: RequestHandler = (req, res, next) => {
  res.set('Pragma', 'no-cache')
  res.set('Cache-Control', 'no-cache, no-store')
  next()
}

const endpoint: EndpointLoader = async (app, wss) => {
  const appRouter = AppRouter()
  const wsRouter = WebSocketRouter()
  const provider = await getProvider()
  const controller = new InteractionController(provider, wss)

  // Wait controller initialization
  await controller.initialize()

  // Handle errors
  appRouter.use(controller.onError)

  // Add passport auth middleware
  const passport = await passportPromise()

  // Handle view
  appRouter.use((req, res, next) => {
    const orig = res.render
    // you'll probably want to use a full blown render engine capable of layouts
    res.render = (view, locals) => {
      app.render(view, locals, (err, html) => {
        if (err !== null) throw err
        orig.call(res, '_layout_authenticate', {
          ...locals,
          body: html
        })
      })
    }
    next()
  })

  // Setup app routes
  appRouter.get('/:credentialType/:did', passport.authenticate('basic', { session: false }), setNoCache, nextIfError(controller.addCredentialByDid)) // se authenticato

  // Setup ws routes
  wsRouter.connect('/did/:uid/socket', controller.socketConnect)
  wsRouter.message('/did/:uid/socket', controller.socketMessage)
  wsRouter.close('/did/:uid/socket', controller.socketClose)

  // appRouter.post('/credential/revoke', setNoCache, body, nextIfError(controller.revokeCredentialByJWT))
  // appRouter.get('/credential/verify/:claim', setNoCache, nextIfError(controller.verifyCredentialByClaim))
  // appRouter.get('/credential/verify/callback', setNoCache, nextIfError(controller.verifyCredentialCallback))

  return { appRouter, wsRouter }
}

/// ///////
export default endpoint
