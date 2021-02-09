import { ErrorRequestHandler } from 'express'
import { HttpError } from 'express-openapi-validator/dist/framework/types'

export const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof HttpError) {
    res.status(Number(err.status) ?? 400).json({
      code: 1,
      message: err.message
    })
  } else {
    next(err)
  }
}
