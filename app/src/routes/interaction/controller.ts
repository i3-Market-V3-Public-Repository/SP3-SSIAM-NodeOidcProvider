import { ErrorRequestHandler, RequestHandler } from 'express'
import * as assert from 'assert'
import * as querystring from 'querystring'
import { inspect } from 'util'
import { isEmpty } from 'lodash'
import Provider, { KoaContextWithOIDC, errors as oidcErrors, InteractionResults } from 'oidc-provider'
import { Credentials, SimpleSigner } from 'uport-credentials'
import { message, transport } from 'uport-transports'
import { getResolver } from 'ethr-did-resolver'
import { Resolver } from 'did-resolver'
// import { decodeJWT } from "did-jwt"

import logger from '@i3-market/logger'
import config from '@i3-market/config'
import { AccountNotFount, IncorrectPassword } from '@i3-market/error'
import { SocketHandler } from '@i3-market/ws/utils'
import WebSocketServer from '@i3-market/ws'
import Account from '@i3-market/account'

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

interface SocketParams {
  uid: string
}

interface SocketData {
  hello: string
}

export default class InteractionController {
  protected credentials: Credentials

  constructor (protected provider: Provider,
    protected wss: WebSocketServer) { }

  public async initialize () {
    const providerConfig = { rpcUrl: 'https://rinkeby.infura.io/ethr-did' }
    const identity = await config.identityPromise
    this.credentials = new Credentials({
      did: identity.did,
      signer: SimpleSigner(identity.privateKey),
      resolver: new Resolver(getResolver(providerConfig))
    })
  }

  // WebSocket Methods
  socketConnect: SocketHandler<SocketParams> = async (socket, req, next) => {
    socket.tag(req.params.uid)
  }

  socketMessage: SocketHandler<SocketParams, SocketData> = async (socket, req, next) => {
    logger.debug('Message socket')
    const json = req.json()
    console.log(json.hello)
  }

  socketClose: SocketHandler<SocketParams> = async (socket, req, next) => {
    logger.debug('Close socket')
  }

  // App Methods
  callback: RequestHandler = async (req, res, next) => {
    const { error: err, access_token: accessToken } = req.body
    const { uid } = req.params

    if (err) {
      return res.status(403).send(err)
    }

    logger.debug(`Received the access token for the interaction "${uid}"`)
    const credentials = await this.credentials.authenticateDisclosureResponse(accessToken)

    // TODO: Verify mandatory credentials
    console.log(credentials)

    // const didDocument = await this.credentials.resolver.resolve(credentials.did)
    // console.log(didDocument)

    // TODO: Finish login here
    // TODO: Consent accepted here

    const socket = this.wss.get(uid)
    if (!socket) {
      logger.debug('The client was disconnected before sending the did...')
    } else {
      // this.provider.setProviderSession(req, res, {

      // })
      socket.send(credentials.did)
      socket.close()
    }
  }

  handleInteraction: RequestHandler = async (req, res, next) => {
    const {
      uid, prompt, params, session
    } = await this.provider.interactionDetails(req, res)

    const client = await this.provider.Client.find(params.client_id)
    const options = {
      client,
      uid,
      details: prompt.details,
      params,
      title: 'Sign-in',

      // Debug info
      isProd: config.isProd,
      session: session ? debug(session) : undefined,
      dbg: {
        params: debug(params),
        prompt: debug(prompt)
      }
    }

    switch (prompt.name) {
      case 'select_account': {
        logger.debug('Select account interaction received')
        if (!session) {
          return await this.provider.interactionFinished(req, res, { select_account: {} }, { mergeWithLastSubmission: false })
        }

        // Types from oidc provider force this cast
        const ctx: KoaContextWithOIDC = undefined as any
        const account = await this.provider.Account
          .findAccount(ctx, session.accountId.toString())

        // TODO: Check undefined account
        if (!account) return
        const { email } = await account.claims('prompt', 'email', { email: null }, [])

        return res.render('select_account', {
          ...options,
          email
        })
      }

      case 'login': {
        // NOTE: To work with uPort, the callback URL MUST use TLS
        const callbackUrl = `https://${req.get('host')}/interaction/${uid}/callback`
        const reqToken = await this.credentials.createDisclosureRequest({
          // TODO: claims Requirements for claims requested from a user. See Claims Specs and Verified Claims
          notifications: true,
          callbackUrl
        })
        logger.debug(reqToken)

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

  login: RequestHandler = async (req, res, next) => {
    const { prompt: { name } } = await this.provider.interactionDetails(req, res)
    assert.equal(name, 'login')

    if (req.body.did) {
      logger.debug(`Check login for "${req.body.did}"`)
    } else {
      logger.debug(`Check login for "${req.body.login}"`)
      const account = await Account.findByLogin(req.body.login)
      if (!account) {
        throw new AccountNotFount(req.body.login)
      }

      if (!await account.checkPassword(req.body.password)) {
        throw new IncorrectPassword(req.body.login)
      }
    }

    // TODO: Use interaction id as account id
    const result: InteractionResults = {
      select_account: {}, // make sure its skipped by the interaction policy since we just logged in
      login: {
        account: req.body.did,
        remember: false
      }
    }

    await this.provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false })
  }

  continue: RequestHandler = async (req, res, next) => {
    const interaction = await this.provider.interactionDetails(req, res)
    const { prompt: { name } } = interaction
    assert.equal(name, 'select_account')

    if (req.body.switch) {
      if (interaction.params.prompt) {
        const prompts = new Set(interaction.params.prompt.split(' '))
        prompts.add('login')
        interaction.params.prompt = [...prompts].join(' ')
      } else {
        interaction.params.prompt = 'login'
      }
      await interaction.save()
    }

    const result = { select_account: {} }
    await this.provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false })
  }

  confirm: RequestHandler = async (req, res, next) => {
    const { prompt: { name } } = await this.provider.interactionDetails(req, res)
    assert.equal(name, 'consent')

    // TODO: Set rejected claims comming from uport (credentials.invalid)
    const consent = {
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
    }

    const result = { consent }
    await this.provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true })
  }

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
