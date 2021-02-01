import { RequestHandler, Router as AppRouter, urlencoded } from 'express'

import { WebSocketRouter } from '@i3-market/ws'
import { EndpointLoader } from '@i3-market/endpoint'

import { getProvider } from '../oidc'
import InteractionController from './controller'

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
  const wsRouter = WebSocketRouter()
  const provider = await getProvider()
  const controller = new InteractionController(provider, wss)
  const body = urlencoded({ extended: false })

  // Wait controller initialization
  await controller.initialize()

  // Handle view
  appRouter.use((req, res, next) => {
    const orig = res.render
    // you'll probably want to use a full blown render engine capable of layouts
    res.render = (view, locals) => {
      app.render(view, locals, (err, html) => {
        if (err !== null) throw err
        orig.call(res, '_layout', {
          ...locals,
          body: html
        })
      })
    }
    next()
  })

  // Setup app routes
  appRouter.get('/:uid', setNoCache, nextIfError(controller.handleInteraction))
  appRouter.post('/:uid/login', setNoCache, body, nextIfError(controller.loginAndConsent))
  appRouter.get('/:uid/abort', setNoCache, nextIfError(controller.abort))
  appRouter.post('/:uid/callback', setNoCache, body, nextIfError(controller.callback))

  // Setup ws routes
  wsRouter.connect('/:uid/socket', controller.socketConnect)
  wsRouter.close('/:uid/socket', controller.socketClose)

  // Handle errors
  appRouter.use(controller.onError)

  return { appRouter, wsRouter }
}

/// ///////

export default endpoint
