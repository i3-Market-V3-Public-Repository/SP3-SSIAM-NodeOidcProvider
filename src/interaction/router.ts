import { RequestHandler, Router, urlencoded } from "express"

import { getProvider } from "../oidc"
import InteractionController from "./controller"


//
function nextIfError(handler: RequestHandler): RequestHandler {
    return async (req, res, next) => {
        await handler(req, res, next).catch(next)
    }
}

const setNoCache: RequestHandler = (req, res, next) => {
    res.set('Pragma', 'no-cache')
    res.set('Cache-Control', 'no-cache, no-store')
    next()
}

//////////

export default async (app): Promise<Router> => {
    const router = Router()
    const provider = await getProvider()
    const controller = new InteractionController(provider)
    const body = urlencoded({ extended: false })

    // Handle view
    router.use((req, res, next) => {
        const orig = res.render
        // you'll probably want to use a full blown render engine capable of layouts
        res.render = (view, locals) => {
            app.render(view, locals, (err, html) => {
                if (err) throw err
                orig.call(res, '_layout', {
                    ...locals,
                    body: html,
                })
            })
        }
        next()
    })

    // Setup routes
    router.get('/:uid', setNoCache, nextIfError(controller.handleInteraction))
    router.post('/:uid/login', setNoCache, body, nextIfError(controller.login))
    router.post('/:uid/continue', setNoCache, body, nextIfError(controller.continue))
    router.post('/:uid/confirm', setNoCache, body, nextIfError(controller.confirm))
    router.get('/:uid/abort', setNoCache, nextIfError(controller.abort))

    // Handle errors
    router.use(controller.onError)

    return router
}
