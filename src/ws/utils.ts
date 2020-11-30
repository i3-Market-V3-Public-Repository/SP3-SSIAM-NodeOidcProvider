import { CanBePromise } from "oidc-provider"
import * as http from "http"
import * as ws from "ws"
import { NextFunction } from "express"

import { Methods } from "./methods"


export const socketTag = Symbol("@@i3-market::socket.tag")

export interface Socket extends ws {
    [socketTag]?: string
    tag(t: string): this
}

export interface Request<T = any, D = never> extends http.IncomingMessage {
    routerPath: string
    socketMethod: string
    params: T

    // ** Method specifics **//
    // Message
    data?: ws.Data
    json(): D

    // Close
    closeCode?: number
}

export type SocketHandler<T = any, D = never> =
    (socket: Socket, req: Request<T, D>, next: NextFunction) => CanBePromise<void>

export interface RouteArguments {
    handler: SocketHandler
    path: string | undefined
}

export interface RouteData<T> {
    children: {
        path: string
        method: Methods
        handler: SocketHandler
    }[]
}

export interface RouteHandler<T> {
    (handler: SocketHandler): T
    (path: string, handler: SocketHandler): T
}

export interface IRouter<T> {
    use: RouteHandler<T>
    connect: RouteHandler<T>
    message: RouteHandler<T>
    close: RouteHandler<T>
}

export function getRouteArguments(args: any[]): RouteArguments {
    let handler: SocketHandler
    let path: string | undefined
    if(args.length === 0) throw new Error('WebSocketRouter must have at least one argument')
    if(typeof args[0] === 'function') {
        handler = args[0]
    } else if(typeof args[0] === 'string' && typeof args[1] === 'function') {
        path = args[0]
        handler = args[1]
    } else {
        throw new Error('WebSocketRouter.use(...): No maching signature for the calling arguments')
    }

    return { handler, path }
}
