import { IRouterMatcher } from "express"

import { Endpoint } from "./endpoint"


interface ExpressCanUse {
    use: IRouterMatcher<any>
}


export function addEndpoint(
    app: ExpressCanUse,
    wss: any,
    path: string,
    endpoint: Endpoint
) {
    if(endpoint.appRouter) {
        app.use(path, endpoint.appRouter)
    }

    if(endpoint.wsRouter) {
        wss.use(path, endpoint.wsRouter)
    }
}
