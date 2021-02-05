// tslint:disable: max-classes-per-file
import { Request, Response } from 'express'

export class AccountNotFount extends Error {
  constructor (public login: string) {
    super(`Account '${login}' not fount`)
  }
}

export class IncorrectPassword extends Error {
  constructor (public login: string) {
    super(`Incorrect password for '${login}'`)
  }
}

export class ErrorResponse extends Error {
  constructor (public statusCode: number, public code: number, message: string) {
    super(message)
  }

  send (req: Request, res: Response): void {
    res.status(this.statusCode).send({
      code: this.code,
      message: this.message
    })
  }
}
