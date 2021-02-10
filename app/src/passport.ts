import passport from 'passport'
import { BasicStrategy } from 'passport-http'
import { adapterFactory } from './adapter'
import { compare } from 'bcrypt'
import logger from './logger'

export default async (): Promise<typeof passport> => {
  const adapter = adapterFactory.createIfNotExists('account')
  passport.use('basic', new BasicStrategy(
    async function (username, password, done) {
      const storedUser = await adapter.findByParam('profile.email', username)
      if (storedUser === undefined) return done(null, false)
      compare(password, storedUser.profile.password).then(val => {
        val ? done(null, storedUser.profile) : done(null, false)
      }).catch(err => {
        logger.error(err.message)
        done(null, false)
      })
    }
  ))
  return passport
}
