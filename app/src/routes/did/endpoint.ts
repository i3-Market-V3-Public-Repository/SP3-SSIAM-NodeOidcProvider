import { RequestHandler, Router as AppRouter, urlencoded } from 'express'

import { WebSocketRouter } from '../../ws'
import { EndpointLoader } from '../../endpoint'
import InteractionController from './controller'
import { getProvider } from '../oidc'

//
function nextIfError (handler: RequestHandler): RequestHandler {
  return async (req, res, next) => {
    await (handler(req, res, next) as any).catch(next)
  }
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
        if (err) throw err
        orig.call(res, '_layout_authenticate', {
          ...locals,
          body: html
        })
      })
    }
    next()
  })


  // Setup app routes
  appRouter.get('/:callbackurl(*)', nextIfError(controller.authenticate)) // se non authenticato
  appRouter.post('/callback/:uid/:callbackurl(*)', body, nextIfError(controller.authenticateCallback))
  
  // Setup ws routes
  wsRouter.connect('/:uid(.*)/socket', controller.socketConnect)
  wsRouter.message('/:uid(.*)/socket', controller.socketMessage)
  wsRouter.close('/:uid(.*)/socket', controller.socketClose)
  
  // Handle errors
  // appRouter.use(controller.onError)

  return { appRouter, wsRouter }
}

/// ///////
export default endpoint