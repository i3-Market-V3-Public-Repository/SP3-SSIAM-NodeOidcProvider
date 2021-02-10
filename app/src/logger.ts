import morgan from 'morgan'
import { Request } from 'express'
import { createLogger, transports, format, Logger } from 'winston'
import config from './config'

// Request logger
const level = config.isProd ? 'info' : '\u001b[32minfo\u001b[39m'
morgan.token<Request>('body', (req, res) => {
  return JSON.stringify(req.body)
})
export const loggerMiddleware =
    morgan(`:date[iso] ${level}: :method :url :status :response-time ms - :res[content-length] :body`)

// Extra information logger
const consoleTransport = new transports.Console()
function createFormat (): Logger['format'] {
  const formats: Array<Logger['format']> = []
  formats.push(format.timestamp())
  if (!config.isProd) formats.push(format.colorize())
  formats.push(
    format.printf((info) => `${info.timestamp as string} ${info.level}: ${info.message}`)
  )

  return format.combine(...formats)
}
export default createLogger({
  level: 'debug',
  transports: [consoleTransport],
  format: createFormat()
})
