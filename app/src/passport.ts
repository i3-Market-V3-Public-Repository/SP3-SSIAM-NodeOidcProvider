import passport from 'passport'
import { BasicStrategy } from 'passport-http'
import { adapterFactory } from './adapter'
import { compare } from 'bcrypt'

const adapter = adapterFactory.createIfNotExists('account')
passport.use('basic', new BasicStrategy(
  async function (username, password, done) {
    const storedUser = adapter.findByParam('email', username)
    if (storedUser === undefined) return done(new Error('bad username/passwd'))
    compare(password, storedUser.password).then(val => {
      val ? done(null, storedUser) : done(new Error('bad username/passwd'))
    }).catch(err => done(err))
  }
))

export default passport
