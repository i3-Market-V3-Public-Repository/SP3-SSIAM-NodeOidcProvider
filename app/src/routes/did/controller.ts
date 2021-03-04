import { RequestHandler } from 'express'
import Provider from 'oidc-provider'
import { Credentials, SimpleSigner } from 'uport-credentials'
import { getResolver } from 'ethr-did-resolver'
import { Resolver } from 'did-resolver'
// import { decodeJWT } from "did-jwt"

import logger from '@i3-market/logger'
import config from '@i3-market/config'
import { SocketHandler } from '@i3-market/ws/utils'
import WebSocketServer from '../../ws'

import { message, transport } from 'uport-transports'

// import { EthrCredentialRevoker } from 'ethr-status-registry'
// import { sign } from 'ethjs-signer'
// const didJWT = require('did-jwt')

interface SocketParams {
  uid: string
}

interface SocketData {
  hello: string
}

export default class InteractionController {
  protected credentials: Credentials

  constructor (protected provider: Provider, protected wss: WebSocketServer) { }

  public async initialize (): Promise<void> {
    const providerConfig = { rpcUrl: config.rpcUrl }
    const identity = await config.identityPromise
    this.credentials = new Credentials({
      did: identity.did,
      signer: SimpleSigner(identity.privateKey),
      resolver: new Resolver(getResolver(providerConfig))
    })
  }

  // WebSocket Methods
  socketConnect: SocketHandler<SocketParams> = async (socket, req) => {
    console.log('socket connect')
    const socketid = req.params.uid.split('/')
    console.log(socketid[0])
    socket.tag(socketid[0])
  }

  socketMessage: SocketHandler<SocketParams, SocketData> = async (socket, req) => {
    logger.debug('Message socket')
    const json = req.json()
    console.log(json.hello)
  }

  socketClose: SocketHandler<SocketParams> = async () => {
    logger.debug('Close socket')
  }

  /**
   * GET /did/{callbackurl} - get did by login process and callback
   *
   */
  authenticate: RequestHandler = async (req, res, next) => {
    // TODO: inizializzare la socket
    const uid = '123uidtest'

    const callbackUrl = `${config.publicUri}/did/callback/${uid}/${req.params.callbackurl}`
    const reqToken = await this.credentials.createDisclosureRequest({
      notifications: true,
      callbackUrl
    })

    // logger.debug(reqToken)
    const query = message.util.messageToURI(reqToken)
    const uri = message.util.paramsToQueryString(query, { callback_type: 'post' })
    const qr = transport.ui.getImageDataURI(uri)

    logger.debug('Authenticate interaction received')
    logger.debug(callbackUrl)
    const title: string = 'Authenticate'
    return res.render('authenticate', { qr, title })
  }

  /**
   * Authenticate api callback
   */
  authenticateCallback: RequestHandler = async (req, res, next) => {
    logger.debug('Authenticate callback')
    const { error: err, access_token: accessToken } = req.body
    const { callbackurl } = req.params

    if (err !== undefined) {
      return res.status(403).send(err)
    }

    const credentials = await this.credentials.authenticateDisclosureResponse(accessToken)

    console.log(credentials)

    const socketid = callbackurl.split('/')
    const socket = this.wss.get(socketid[0])
    console.log('socketid: ', socketid[0])
    if (socket === undefined) {
      logger.debug('The client was disconnected before sending the did...')
    } else {
      socket.send(credentials.did + ',' + callbackurl)
      socket.close()
    }
  }
}
