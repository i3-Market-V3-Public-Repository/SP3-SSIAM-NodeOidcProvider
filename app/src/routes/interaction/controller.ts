import { ErrorRequestHandler, RequestHandler } from 'express'
import * as assert from 'assert'
import * as querystring from 'querystring'
import { inspect } from 'util'
import { isEmpty } from 'lodash'
import Provider, { errors as oidcErrors, InteractionResults } from 'oidc-provider'
import { Credentials, SimpleSigner } from 'uport-credentials'
import { message, transport } from 'uport-transports'
import { getResolver } from 'ethr-did-resolver'
import { Resolver } from 'did-resolver'
// import { decodeJWT } from "did-jwt"

import logger from '@i3-market/logger'
import config from '@i3-market/config'
import { retry } from '@i3-market/util'
import { AccountNotFount, IncorrectPassword } from '@i3-market/error'
import WebSocketServer, { SocketHandler } from '@i3-market/ws'
import { random, Cipher } from '@i3-market/security'

import { disclosureArgs, fetchClaims, UportClaims } from './uport-scopes'

const { SessionNotFound } = oidcErrors
const keys = new Set()
const debug = (obj) => querystring.stringify(Object.entries(obj).reduce((acc, [key, value]) => {
  keys.add(key)
  if (isEmpty(value)) return acc
  acc[key] = inspect(value, { depth: null })
  return acc
}, {}), '<br/>', ': ', {
  encodeURIComponent (value) { return keys.has(value) ? `<strong>${value}</strong>` : value }
})

interface Params { [key: string]: string}
interface InteractionParams extends Params { uid: string }

interface SelectiveDisclousureResponseBody { error: any, access_token: string }
interface LoginBody { code?: string }

export default class InteractionController {
  protected credentials: Credentials
  protected cipher: Cipher

  constructor (protected provider: Provider,
    protected wss: WebSocketServer) { }

  public async initialize (): Promise<void> {
    const providerConfig = { rpcUrl: config.rpcUrl }
    const identity = await config.identityPromise

    this.credentials = new Credentials({
      did: identity.did,
      signer: SimpleSigner(identity.privateKey),
      resolver: new Resolver(getResolver(providerConfig))
    })

    const secret = await random(256 / 8)
    this.cipher = new Cipher('aes-256-gcm', secret)
  }

  // WebSocket Methods
  socketConnect: SocketHandler<InteractionParams> = async (socket, req, next) => {
    socket.tag(req.params.uid)
  }

  socketClose: SocketHandler<InteractionParams> = async (socket, req, next) => {
    logger.debug('Close socket')
  }

  // App Methods

  // Callback handler where the selective disclosure is resolved
  callback: RequestHandler<InteractionParams, any, SelectiveDisclousureResponseBody> = async (req, res, next) => {
    const { error: err, access_token: accessToken } = req.body
    const { uid } = req.params

    if (err) {
      if (typeof err === 'string') {
        logger.error(`Selective disclosure error: ${err}`)
      } else {
        logger.error('Unknown selective disclosure error')
      }
      return res.status(403).send(err)
    }

    logger.debug(`Received the access token for the interaction "${uid}"`)

    //
    const socket = await retry(() => this.wss.get(uid), {
      interval: 500, // ms
      tries: 20 // 500 ms * 20 = 10s
    }).catch((reason) => {
      res.status(400).send(reason.message)
      logger.error('Cannot connect the socket')
    })

    if (socket === undefined) {
      return
    }

    // const jwt = await sign(loginJwt, this.privateKey)
    logger.debug(`uPort access token: ${accessToken}`)
    logger.debug('Encrypt the access token')
    const encryptedAccessToken = await this.cipher.encryptString(accessToken)

    // Close the socket once the access token is sent
    socket.send(encryptedAccessToken, (err) => {
      if (!err) {
        socket.close()
        return
      }

      logger.error('Error sending the access token')
      console.trace(err)
    })

    res.send(200)
  }

  handleInteraction: RequestHandler = async (req, res, next) => {
    const {
      uid, prompt, params, session
    } = await this.provider.interactionDetails(req, res)
    const scope = params.scope

    const client = await this.provider.Client.find(params.client_id)
    const options = {
      client,
      uid,
      details: prompt.details,
      params,
      title: 'Sign-in',

      // Debug info
      isProd: config.isProd,
      session: session !== undefined ? debug(session) : undefined,
      dbg: {
        params: debug(params),
        prompt: debug(prompt)
      }
    }

    switch (prompt.name) {
      case 'loginAndConsent': {
        // NOTE: To work with uPort, the callback URL MUST use TLS
        const callbackUrl = `https://${req.get('host')}/interaction/${uid}/callback`
        const disclosureOptions = disclosureArgs(scope.split(' '))
        const reqToken = await this.credentials.createDisclosureRequest({
          ...disclosureOptions,
          // TODO: claims Requirements for claims requested from a user. See Claims Specs and Verified Claims
          notifications: true,
          callbackUrl
        })

        const query = message.util.messageToURI(reqToken)
        const uri = message.util.paramsToQueryString(query, { callback_type: 'post' })
        const qr = transport.ui.getImageDataURI(uri)

        logger.debug('Login interaction received')
        return res.render('login', {
          ...options, qr
        })
      }

      case 'consent': {
        logger.debug('Consent interaction received')
        return res.render('interaction', {
          ...options,
          title: 'Authorize'
        })
      }

      default:
        return undefined
    }
  }

  loginAndConsent: RequestHandler<InteractionParams, any, LoginBody> = async (req, res, next) => {
    logger.debug('Login method called')
    const details = await this.provider.interactionDetails(req, res)

    const { prompt: { name }, params } = details
    const scope: string = params.scope
    const clientId = params.client_id
    const sessionData: any = details.session

    assert.equal(name, 'loginAndConsent')

    if (!req.body.code) {
      logger.error('No code provided')
      throw new Error('No code provided')
    }

    const encryptedAccessToken = req.body.code
    const accessToken = await this.cipher.decryptString(encryptedAccessToken)
    let claims: UportClaims
    try {
      const discResponse = await this.credentials.authenticateDisclosureResponse(accessToken)
      claims = fetchClaims(scope.split(' '), discResponse)
    } catch (err) {
      console.trace(err)
      return res.status(400).send({
        err: 'cannot authenticate the selective disclosure response'
      })
    }

    // Update de session
    // TODO: Resolve the claims properly

    // TODO: Check invalid credentials and add them into rejected scopes and claims
    // TODO: Use interaction id as account id
    let result: InteractionResults
    let previousMeta: any = {}

    if (sessionData?.uid !== undefined) {
      const session = await this.provider.Session.findByUid(sessionData.uid)
      if (session !== undefined) {
        previousMeta = session.metaFor(clientId)
      }
    }

    if (claims.rejectedScopes.length === 0) {
      result = {
        select_account: {}, // make sure its skipped by the interaction policy since we just logged in
        login: {
          account: claims.sub,
          remember: false
        },
        consent: {
          // any scopes you do not wish to grant go in here
          //   otherwise details.scopes.new.concat(details.scopes.accepted) will be granted
          rejectedScopes: [],

          // any claims you do not wish to grant go in here
          //   otherwise all claims mapped to granted scopes
          //   and details.claims.new.concat(details.claims.accepted) will be granted
          rejectedClaims: [],

          // replace = false means previously rejected scopes and claims remain rejected
          // changing this to true will remove those rejections in favour of just what you rejected above
          replace: false
        },

        meta: {
          ...previousMeta,
          [scope]: Buffer.from(JSON.stringify(claims)).toString('base64')
        }
      }
    } else {
      result = {
        error: 'access_denied',
        error_description: 'A mandatory verifiable claim is missing or has an untrusted signer'
      }
    }
    await this.provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false })
  }

  // TODO: Remove this??
  abort: RequestHandler = async (req, res, next) => {
    const result = {
      error: 'access_denied',
      error_description: 'End-User aborted interaction'
    }
    await this.provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false })
  }

  onError: ErrorRequestHandler = async (err, req, res, next) => {
    // TODO: Handle errors properly
    if (err instanceof SessionNotFound) {
      // handle interaction expired / session not found error
      return res.status(401).send('<strong>The session has been expired</strong>')
    } else if (err instanceof AccountNotFount || err instanceof IncorrectPassword) {
      return res.status(404).send(`<strong>${err.message}</strong>`)
    } else {
      next(err)
    }
  }
}
