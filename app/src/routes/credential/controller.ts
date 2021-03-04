import { ErrorRequestHandler, RequestHandler } from 'express'
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
    console.log(req.params)
    socket.tag(req.params.uid)
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
   * GET /credential/{credentialType}/{did} - create a new credential
   *
   * TODO: cloud wallet integration
   */
  addCredentialByDid: RequestHandler = async (req, res, next) => {
    const attestation = await this.credentials.createVerification({
      sub: req.params.did,
      exp: Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60,
      claim: {
        [req.params.credentialType]: true
      }
    })

    logger.debug(`\nEncoded JWT sent to user: ${attestation}\n`)
    const uri = message.util.paramsToQueryString(message.util.messageToURI(attestation), { callback_type: 'post' })
    const qr = transport.ui.getImageDataURI(uri)
    logger.debug(qr)
    const title = 'Scan to add the ' + req.params.credentialType + ' credential'
    res.render('create_credential', { qr, title })
  }

  /**
   * GET /credential/{did} - nel body i dati della credential (da capire come fare)
   *
   * TODO:  usare did-jtw anziche createVerification, metterci dentro il credentialStatus
   * gestire creazione qr oppure invio del jwt ad url (passato in input)
   * integrare wallet
   */
  addCredentialCallback: RequestHandler = async (req, res, next) => {
    const jwt = req.body.access_token

    if (req.params.did !== undefined) {
      // TODO: se è null me lo estraggo dal jwt
      console.log('req addCredentialByDid')
      // console.log(req)
    }

    const creds = await this.credentials.authenticateDisclosureResponse(jwt)

    const push = transport.push.send(creds.pushToken, creds.boxPub)

    // quando creiamo una credentials dobbiamo avere embed il credentialStatus (vedi ethr-registry-status) dentro il payload usando did-jwt ?
    const attestation = await this.credentials.createVerification({
      // sub: 'did:ethr:0x31486054a6ad2c0b685cd89ce0ba018e210d504e', //application did
      sub: req.params.did, // TODO: se non c'è nei param lo prendo dal jwt
      exp: Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60,
      claim: {
        Identity: { 'Last Seen': `${(new Date()).toString()}` },
        Role: { 'User Role': req.params.credentialType }
      }
    })

    console.log(`\nEncoded JWT sent to user: ${attestation}\n`)
    await push(attestation) // *push* the notification to the user's uPort mobile app.

    console.log('Push notification sent and should be recieved any moment...')
    console.log('Accept the push notification in the uPort mobile application')
  }

  /**
   * GET /credential - nel body i dati della credential (da capire come fare)
   */
  addCredentialByAuthentication: RequestHandler = async (req, res, next) => {
    const credentialType = req.params.credentialType
    console.log('addCredentialByAuthentication. CredentialType: ' + credentialType)

    console.log('addCredentialByAuthentication')
    const callbackUrl = `${config.publicUri}/did/callback/${credentialType}`
    console.log(callbackUrl)
    const reqToken = await this.credentials.createDisclosureRequest({
      // TODO: claims Requirements for claims requested from a user. See Claims Specs and Verified Claims
      notifications: true,
      callbackUrl
      // verified: ['role']
    })
    logger.debug('reqToken: ' + reqToken)

    const query = message.util.messageToURI(reqToken)
    const uri = message.util.paramsToQueryString(query, { callback_type: 'post' })
    const qr = transport.ui.getImageDataURI(uri)

    logger.debug('Login interaction received')

    const options = {

    }

    return res.render('login', {
      ...options, qr
    })
  }

  /**
   * POST /credential/revoke - nel body il JWT
   *
   * TODO: la revoke ha il JWT come input nel body ? Chi chiama la revoke ? Oidc è issuer e anche holder ?

  revokeCredentialByJWT: RequestHandler = async (req, res, next) => {

    console.log('req.body')
    console.log(req.body)

    const identity = await config.identityPromise;
    const privateKey = '0x' + identity.privateKey // '0x<Issuer Private Key>'
    const ethSigner = (rawTx: any, cb: any) => cb(null, sign(rawTx, privateKey))

    // const credential = '<JWT token with credentialStatus>' //TODO: prenderlo dal body
    // FIXME: su questo manca il credential status
    const credential = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpYXQiOjE1ODg5MjIyMDEsImNyZWRlbnRpYWxTdGF0dXMiOnsidHlwZSI6IkV0aHJTdGF0dXNSZWdpc3RyeTIwMTkiLCJpZCI6InJpbmtlYnk6MHg5N2ZkMjc4OTJjZGNEMDM1ZEFlMWZlNzEyMzVjNjM2MDQ0QjU5MzQ4In0sImlzcyI6ImRpZDpldGhyOjB4NTRkNTllM2ZmZDc2OTE3ZjYyZGI3MDJhYzM1NGIxN2YzODQyOTU1ZSJ9.0sLZupOnyrdZPQAhtfa2eP_2HN_FELJu_clbXBrk9SgaU_ZO0izjDLTnNkip9RVM6ED0nLznfT35XHk6_C9S_Q'

    const revoker = new EthrCredentialRevoker({ infuraProjectId: 'https://rinkeby.infura.io/ethr-did' }) //TODO: metto il mio progetto
    const txHash = await revoker.revoke(credential, ethSigner)
    console.log('txHash')
    console.log(txHash)
  } */

  /**
   * GET /credential/verify/{claim}
   *
   * TODO:
   *    - https://developer.uport.me/credentials/requestverification#request-verifications questo è per i ruoli nel login
   *
   *
   *    - https://github.com/decentralized-identity/did-jwt prima questo
   *    - https://github.com/uport-project/credential-status poi questo
   *    - poi aggiungere controllo se è stata revocata usando https://github.com/uport-project/credential-status

  verifyCredentialByClaim: RequestHandler = async (req, res, next) => {

    console.log('claim to verify: ' + req.params.claim)

    const providerConfig = { rpcUrl: 'https://rinkeby.infura.io/ethr-did' } // FIXME:
    const identity = await config.identityPromise
    console.log('identity: ' + JSON.stringify(identity))
    const credentials = new Credentials({
      did: 'did:ethr:0x31486054a6ad2c0b685cd89ce0ba018e210d504e', //did in input
      //did: req.params.did, //did in input
      signer: SimpleSigner('ef6a01d0d98ba08bd23ee8b0c650076c65d629560940de9935d0f46f00679e01'), //FIXME: qui che chiave ci va ?
      resolver: new Resolver(getResolver(providerConfig))
    })

    credentials.createDisclosureRequest({
      verified: [req.params.claim],
      callbackUrl: '/credential/verify/callback'
    }).then(requestToken => {

      console.log(didJWT.decodeJWT(requestToken))  //log request token to console
      const uri = message.util.paramsToQueryString(message.util.messageToURI(requestToken), {callback_type: 'post'})
      const qr =  transports.ui.getImageDataURI(uri)
      console.log(qr)
    })
  } */

  /**
   * GET /credential/verify/callback

  verifyCredentialCallback: RequestHandler = async (req, res, next) => {

    const providerConfig = { rpcUrl: 'https://rinkeby.infura.io/ethr-did' } // FIXME:

    const identity = await config.identityPromise
    console.log('identity: ' + JSON.stringify(identity))
    const credentials = new Credentials({
      did: 'did:ethr:0x31486054a6ad2c0b685cd89ce0ba018e210d504e', //did in input
      //did: req.params.did, //did in input
      signer: SimpleSigner('ef6a01d0d98ba08bd23ee8b0c650076c65d629560940de9935d0f46f00679e01'), //FIXME: qui che chiave ci va ?
      resolver: new Resolver(getResolver(providerConfig))
    })

    const jwt = req.body.access_token
    console.log(jwt)
    console.log(didJWT.decodeJWT(jwt))

    credentials.authenticateDisclosureResponse(jwt).then(creds => {
      //validate specific data per use case
      console.log(creds)
    }).catch( err => { console.log('oops') })
  } */

  onError: ErrorRequestHandler = async (err, req, res, next) => {
    console.trace(err)
    next(err)
  }
}
