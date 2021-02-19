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

const transports = require('uport-transports').transport
const message = require('uport-transports').message.util



//import { EthrCredentialRevoker } from 'ethr-status-registry'
//import { sign } from 'ethjs-signer'
//const didJWT = require('did-jwt')

interface SocketParams {
  uid: string
}

interface SocketData {
  hello: string
}

export default class InteractionController {

  protected credentials: Credentials

  constructor (protected provider: Provider, protected wss: WebSocketServer) { }

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

    const providerConfig = { rpcUrl: 'https://rinkeby.infura.io/ethr-did' }   
    const identity = await config.identityPromise        
    const credentials = new Credentials({      
      did: identity.did, 
      signer: SimpleSigner(identity.privateKey), 
      resolver: new Resolver(getResolver(providerConfig))
    })
    
    credentials.createVerification({
      sub: req.params.did,
      exp: Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60,
      claim: {
        [req.params.credentialType] : true
      },
            
    }).then(attestation => {
      
      logger.debug(`\nEncoded JWT sent to user: ${attestation}\n`)
      const uri = message.paramsToQueryString(message.messageToURI(attestation), {callback_type: 'post'})
      const qr =  transports.ui.getImageDataURI(uri)
      logger.debug(qr)
      const title = 'Scan to add the ' + req.params.credentialType + ' credential';
      return res.render('create_credential', { qr, title })

    }).catch(e => { console.log(e) })
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


    if(!req.params.did) {
      //TODO: se è null me lo estraggo dal jwt
      console.log('req addCredentialByDid')
      //console.log(req)
    }

    const providerConfig = { rpcUrl: 'https://rinkeby.infura.io/ethr-did' }   
    const identity = await config.identityPromise        
    const credentials = new Credentials({      
      //did: 'did:ethr:0x31486054a6ad2c0b685cd89ce0ba018e210d504e', //questo va, ma ci deve andare l'application did 
      did: identity.did, //application did
      //signer: SimpleSigner('ef6a01d0d98ba08bd23ee8b0c650076c65d629560940de9935d0f46f00679e01'),
      signer: SimpleSigner(identity.privateKey), 
      resolver: new Resolver(getResolver(providerConfig))
    })

    
    credentials.authenticateDisclosureResponse(jwt).then(creds => {

      const push = transports.push.send(creds.pushToken, creds.boxPub)

      // quando creiamo una credentials dobbiamo avere embed il credentialStatus (vedi ethr-registry-status) dentro il payload usando did-jwt ? 
      credentials.createVerification({
        //sub: 'did:ethr:0x31486054a6ad2c0b685cd89ce0ba018e210d504e', //application did 
        sub: req.params.did, //TODO: se non c'è nei param lo prendo dal jwt 
        exp: Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60,
        claim: {
          'Identity' : {'Last Seen' : `${new Date()}`}, 
          'Role': { 'User Role': req.params.credentialType } 
        }      
      }).then(attestation => {
        
        console.log(`\nEncoded JWT sent to user: ${attestation}\n`)
        return push(attestation)  // *push* the notification to the user's uPort mobile app.

      }).then(res => {
        
        console.log('Push notification sent and should be recieved any moment...')
        console.log('Accept the push notification in the uPort mobile application')
      
      }).catch(e => { console.log(e) })
    })
  }

  /**
   * GET /credential - nel body i dati della credential (da capire come fare)   
   */
  addCredentialByAuthentication: RequestHandler = async (req, res, next) => {

    const credentialType = req.params.credentialType;
    console.log('addCredentialByAuthentication. CredentialType: ' + credentialType);

    console.log('addCredentialByAuthentication');      
    const callbackUrl = `https://${req.get('host')}/did/callback/${credentialType}` 
    console.log(callbackUrl)
    const reqToken = await this.credentials.createDisclosureRequest({
      // TODO: claims Requirements for claims requested from a user. See Claims Specs and Verified Claims
      notifications: true,
      callbackUrl,
      //verified: ['role']
    })
    logger.debug('reqToken: ' + reqToken)

    const query = message.messageToURI(reqToken)
    const uri = message.paramsToQueryString(query, { callback_type: 'post' })
    const qr = transports.ui.getImageDataURI(uri)

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
  }*/   

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
      const uri = message.paramsToQueryString(message.messageToURI(requestToken), {callback_type: 'post'})
      const qr =  transports.ui.getImageDataURI(uri)
      console.log(qr)
    })
  }*/

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
  }*/

}
