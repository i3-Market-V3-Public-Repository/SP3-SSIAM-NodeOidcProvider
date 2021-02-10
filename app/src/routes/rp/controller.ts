import { ErrorRequestHandler, RequestHandler } from 'express'
import Provider, { Adapter, AdapterPayload } from 'oidc-provider'
import * as _ from 'lodash'

import { adapterFactory } from '@i3-market/adapter'
import { ErrorResponse } from '@i3-market/error'

import { RelyPartyAlreadyExistsError } from './error'
import { RegisterRequest, RegisterResponse } from './models'

interface Params { [key: string]: string}
interface ClientParams extends Params { clientId: string }

export default class Controller {
  public clientDefaults: AdapterPayload
  public clientAdapter: Adapter

  constructor (protected provider: Provider) {
    this.clientAdapter = adapterFactory.createIfNotExists('client')
    this.clientDefaults = {
      grant_types: ['authorization_code'],
      token_endpoint_auth_method: 'none'
    }
  }

  public async initialize (): Promise<void> { }

  newClient: RequestHandler<ClientParams, RegisterResponse, RegisterRequest> = async (req, res, next) => {
    // Get params from request
    const id = req.body.clientId
    const body = req.body

    // Create the object
    const client: AdapterPayload = Object.assign(this.clientDefaults, {
      client_id: id,
      client_secret: body.clientSecret,
      redirect_uris: body.redirectUris,
      token_endpoint_auth_method: body.tokenEndpointAuthMethod,
      post_logout_redirect_uris: body.postLogoutRedirectUris
    })

    // Check if client exists
    const dbClient = await this.clientAdapter.find(id)
    console.log(dbClient)
    if (dbClient !== undefined) {
      throw new RelyPartyAlreadyExistsError()
    }

    // Insert the client
    await this.clientAdapter.upsert(id, client, 0)

    res.status(201).send({
      clientId: id,
      redirectUris: body.redirectUris,
      tokenEndpointAuthMethod: body.tokenEndpointAuthMethod,
      postLogoutRedirectUris: body.postLogoutRedirectUris
    })
  }

  onError: ErrorRequestHandler = async (err, req, res, next) => {
    if (err instanceof ErrorResponse) {
      return err.send(req, res)
    }
    next(err)
  }
}
