import * as pathRegexp from "path-to-regexp"
import { Methods } from "./methods"

import { getRouteArguments, IRouter, RouteData, RouteHandler, SocketHandler } from "./utils"


type Router = IRouter<Router> & SocketHandler
export function WebSocketRouter<P>(): Router {
    const data: RouteData<any> = {
        children: []
    }

    // TODO: Optimize routing function if needed!
    const router: Router = (socket, req, next) => {
        const routerPath = req.routerPath || ''

        const url = req.url || ''
        for(const child of data.children) {
            if(child.method !== Methods.all && child.method !== req.socketMethod) {
                continue
            }
            const oldParams = req.params
            // Match url
            req.routerPath = routerPath + child.path
            const match = pathRegexp.match(req.routerPath, {
                end: false,
                decode: decodeURIComponent })
            const res = match(url)
            if(res) {
                Object.assign(req.params, res.params)
                child.handler(socket, req, next)
            }
            req.params = oldParams
        }
    }

    router.use = methodHandler(Methods.all)
    router.connect = methodHandler(Methods.connect)
    router.message = methodHandler(Methods.message)
    router.close = methodHandler(Methods.close)

    return router

    //

    function methodHandler(method: Methods): RouteHandler<Router> {
        return (...args) => {
            const { handler, path } = getRouteArguments(args)
            data.children.push({
                path: path || '',
                method,
                handler
            })

            return router
        }
    }
}

/**
 * Alias to enable the use of WebSocketRouter as type
 */
// tslint:disable-next-line: no-empty-interface
export interface WebSocketRouter extends Router {}
