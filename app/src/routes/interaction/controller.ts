import { ErrorRequestHandler, RequestHandler } from 'express'
import * as assert from 'assert'
import * as querystring from 'querystring'
import { inspect } from 'util'
import { isEmpty } from 'lodash'
import Provider, { errors as oidcErrors, InteractionResults } from 'oidc-provider'
// import { Credentials, SimpleSigner } from 'uport-credentials'
// import { message, transport } from 'uport-transports'
// import { getResolver } from 'ethr-did-resolver'
// import { Resolver } from 'did-resolver'
import { decodeJWT } from "did-jwt"

import logger from '@i3-market/logger'
import config from '@i3-market/config'
// import { retry } from '@i3-market/util'
import { AccountNotFount, IncorrectPassword } from '@i3-market/error'
import WebSocketServer, { SocketHandler } from '@i3-market/ws'
import { random, Cipher } from '@i3-market/security'

import { disclosureArgs, /*fetchClaims, UportClaims*/ } from './uport-scopes'
import { ICredentialRequestInput } from '@veramo/selective-disclosure'

import { agent } from './agent'

const { SessionNotFound } = oidcErrors
const keys = new Set()
const debug = (obj): string => querystring.stringify(Object.entries(obj).reduce((acc, [key, value]) => {
  keys.add(key)
  if (isEmpty(value)) return acc
  acc[key] = inspect(value, { depth: null })
  return acc
}, {}), '<br/>', ': ', {
  encodeURIComponent (value) { return keys.has(value) ? `<strong>${value}</strong>` : value }
})

interface Params { [key: string]: string}
interface InteractionParams extends Params { uid: string }

// interface SelectiveDisclousureResponseBody { error: any, access_token: string }
interface LoginBody { code?: string }

export default class InteractionController {
  // protected credentials: Credentials
  protected cipher: Cipher

  constructor (protected provider: Provider, protected wss: WebSocketServer) { }

  public async initialize (): Promise<void> {
    // const providerConfig = { rpcUrl: config.rpcUrl }
    // const identity = await config.identityPromise

    /*
    this.credentials = new Credentials({
      did: identity.did,
      signer: SimpleSigner(identity.privateKey),
      resolver: new Resolver(getResolver(providerConfig))
    })*/

    const secret = await random(256 / 8)
    this.cipher = new Cipher('aes-256-gcm', secret)
    logger.info('controller initialized...')
  }

  // WebSocket Methods
  socketConnect: SocketHandler<InteractionParams> = async (socket, req, next) => {
    socket.tag(req.params.uid)
  }

  socketClose: SocketHandler<InteractionParams> = async (socket, req, next) => {
    logger.info('Close socket')
  }

  // App Methods
  handleInteraction: RequestHandler = async (req, res, next) => {
    logger.info('handleInteraction...')
    const {
      uid, prompt, params, session
    } = await this.provider.interactionDetails(req, res)
    console.log(uid, prompt, params, session)
    const scope = params.scope

    const client = await this.provider.Client.find(params.client_id)
    console.log('client')
    console.log(client)
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

        // Retrieve Veramo identity
        const identity = await agent.didManagerGetOrCreate({
          alias: 'OIDCprovider',
          provider: 'did:ethr:i3m'
        })      
        console.log('did:' + identity.did)

        // Extract the disclosure claims
        /*const disclosureOptions: any = disclosureArgs(scope.split(' '))
        
        // Retrive the claims to disclosure
        const claimsToDisclosure: any = Object.keys(disclosureOptions.claims?.verifiable || {})
        
        // Build an array with the required claims in ICredentialRequestInput format
        
        let claimsSdr: any[] = []
        claimsToDisclosure.forEach(claim => {
          claimsSdr.push({ claimType: claim })
        })

        console.log('claimsSdr')
        console.log(claimsSdr)*/

        const claims: ICredentialRequestInput[] = Object
          .entries(disclosureArgs(scope.split(' ')).claims?.verifiable ?? {})
          .map(([claimType, claim]) => ({
            claimType,
            essential: claim.essential,
            reason: claim.reason
          }))
        
        
        console.log('claims')
        console.log(claims)

        // Generate the selective disclosure request
        const rawSdr = await agent.createSelectiveDisclosureRequest({
          data: {
            issuer: identity.did,
            claims
          }
        })
        console.log('Raw selective disclosure request')
        console.log(rawSdr)
          
        logger.info('Login interaction received')
        return res.render('login', {
          ...options, rawSdr
        })
      }

      case 'consent': {
        logger.info('Consent interaction received')
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
    logger.info('Login method called')
    const details = await this.provider.interactionDetails(req, res)

    const { prompt: { name }, params } = details
    const scope: string = params.scope
    const clientId = params.client_id
    const sessionData: any = details.session

    assert.strictEqual(name, 'loginAndConsent')

    if (!req.body.code) { // eslint-disable-line
      logger.error('No jwt provided')
      throw new Error('No jwt provided')
    }

    //const encryptedAccessToken = req.body.code
    //const accessToken = await this.cipher.decryptString(encryptedAccessToken)
    const verifiablePresentationJWT: any = req.body.code    

    const verifiablePresentation: any = decodeJWT(verifiablePresentationJWT)    
    logger.info('verifiablePresentation')
    logger.info(verifiablePresentation)
    
    //TODO: API call to VC service to verify if the presentation contains revoked credentials
    //let vcServiceResponse = await axios.post(config.verifiableCredentialServiceEndpoint + '/presentation/verify', verifiablePresentation)


    const verifiableCredentialsArrayJWT: any[] = verifiablePresentation.payload.vp.verifiableCredential

    let trustedVerifiableCredential: any[] = []
    let untrustedVerifiableCredential: any[] = []
    verifiableCredentialsArrayJWT.forEach(credentialJWT => {
      let credential: any = decodeJWT(credentialJWT)
      // console.log(credential)
      if(verifiablePresentation.payload.iss === credential.payload.sub) {
        trustedVerifiableCredential.push(credentialJWT)
      } else {
        untrustedVerifiableCredential.push(credentialJWT) 
      }      
    })

    // Update de session
    // TODO: Resolve the claims properly

    let claims: any
    claims = {
      sub: verifiablePresentation.payload.iss,
      verifiedClaims: {
        trusted: trustedVerifiableCredential,
        untrusted: untrustedVerifiableCredential
      },
      rejectedScopes: [],
      nonProvided: []
    }

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
    
    // console.log('result')
    // console.log(result)
    
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
