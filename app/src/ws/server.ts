import * as http from 'http'
import * as https from 'https'
import * as ws from 'ws'

import logger from '@i3-market/logger'

import { WebSocketRouter } from './router'
import { IRouter, Request, RouteHandler, Socket, socketTag } from './utils'
import { Methods } from './methods'

type Server = http.Server | https.Server

const nextFunction = (): void => {
  logger.debug('executed next function')
  throw new Error('Not implemented yet!')
}

function json<D> (this: Request): D {
  if (typeof this.data === 'string') {
    return JSON.parse(this.data)
  }
  throw Error('Cannot parse json')
}

export class WebSocketServer implements IRouter<WebSocketServer> {
  protected wss: ws.Server
  protected rootRouter: WebSocketRouter
  protected tags: {
    [tag: string]: Socket
  }

  constructor (server: Server) {
    this.tags = {}
    this.rootRouter = WebSocketRouter()

    // Initialize web socket server
    this.wss = new ws.Server({ server })
    this.wss.on('connection', (wsoc, req: Request) => {
      const socket = this.prepareSocket(wsoc)
      this.handle(socket, req, Methods.connect)

      wsoc.on('message', (data) => {
        req.data = data
        if (data === '@keepalive@') {
          this.handle(socket, req, Methods.keepAlive)
        } else {
          this.handle(socket, req, Methods.message)
        }
      })

      //
      wsoc.on('close', (code, reason) => {
        const tag = wsoc[socketTag]
        req.closeCode = code

        // Delete the socket form the tags dictionary
        if (tag) {
          logger.debug(`Closing the socket with tag '${tag}'`)
          if (wsoc !== this.tags[tag]) {
            throw new Error('This socket was tagged with the same tag twice!')
          }

          delete this.tags[tag]
        } else {
          logger.debug('Closing an untagged socket')
        }

        // Handle the close method
        this.handle(socket, req, Methods.close)
      })
    })
  }

  handle (socket: Socket, req: Request, method: Methods): void {
    if (method === Methods.keepAlive) {
      logger.debug(`${method} ${req.url}`)
    } else {
      logger.info(`${method} ${req.url}`)
    }

    this.initRequest(req, method)
    this.rootRouter(socket, req, nextFunction)
  }

  get (t: string): Socket | undefined {
    return this.tags[t]
  }

  prepareSocket (socket: ws): Socket {
    const server = this
    return Object.assign(socket, {
      tag (t: string): Socket {
        // Set the tag to the socket
        this[socketTag] = t

        // Add the socket server using its tag
        server.tags[t] = this
        return this
      }
    })
  }

  initRequest (req: Request, method: Methods): void {
    req.routerPath = ''
    req.socketMethod = method
    req.params = {}
    req.json = json
  }

  route = (method: string) => (...args) => {
    // Hack to call the router.use function using the arguments sent to this funciton
    (this.rootRouter as any)[method](...args)
    return this
  }

  use: RouteHandler<this> = this.route('use')
  connect: RouteHandler<this> = this.route('connect')
  keepAlive: RouteHandler<this> = this.route('keepAlive')
  message: RouteHandler<this> = this.route('message')
  close: RouteHandler<this> = this.route('close')
}
