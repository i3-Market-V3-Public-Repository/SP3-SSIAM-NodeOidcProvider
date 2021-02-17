import { ErrorRequestHandler, RequestHandler } from 'express'
import Provider from 'oidc-provider'
import { ErrorResponse } from '@i3-market/error'
import { LoginResponse } from './models'

export default class Controller {
  protected provider: Provider

  constructor (provider: Provider) {
    this.provider = provider
  }

  public async initialize (): Promise<void> { }

  login: RequestHandler<never, LoginResponse, never> = async (req, res, next) => {
    // Get params from request
    const initialAccessToken = new (this.provider.InitialAccessToken)({ expiresIn: 1800 }) // seconds
    const token = await initialAccessToken.save()
    res.json({
      initialAccessToken: token
    })
  }

  onError: ErrorRequestHandler = async (err, req, res, next) => {
    if (err instanceof ErrorResponse) {
      return err.send(req, res)
    }
    next(err)
  }
}
