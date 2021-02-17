import { ErrorResponse } from '@i3-market/error'

export class RelyPartyAlreadyExistsError extends ErrorResponse {
  constructor () {
    super(409, 1000, 'Client already exists')
  }
}
