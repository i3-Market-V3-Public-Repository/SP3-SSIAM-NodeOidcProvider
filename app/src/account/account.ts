import { assign } from 'lodash'
import { Account as IAccount, AccountClaims, CanBePromise, ClaimsParameterMember, FindAccount, AdapterPayload } from 'oidc-provider'
import { compare } from 'bcrypt'

import { adapterFactory } from '@i3-market/adapter'
import logger from '@i3-market/logger'

interface Profile {
  email: string
  name: string
  password: string
}

export default class Account implements IAccount {
  accountId: string
  profile: Profile
  // TODO: Get types from uPort typescript
  verifiedClaims: {}

  constructor (record: AdapterPayload) {
    assign(this, record)
    // record
  }

  claims (
    use: string,
    scope: string,
    claims: { [key: string]: ClaimsParameterMember | null },
    rejected: string[]
  ): CanBePromise<AccountClaims> {
    // OpenID
    const accountClaims: AccountClaims = {
      sub: this.accountId
    }

    // Profile
    if (this.profile !== undefined) {
      accountClaims.name = this.profile.name
    }

    // VC
    accountClaims.verified_claims = this.verifiedClaims

    return accountClaims
  }

  async checkPassword (password: string): Promise<boolean> {
    return await compare(password, this.profile.password)
  }

  static adapterName: string = 'Account'

  static async findByLogin (login: string): Promise<Account | undefined> {
    const adapter = adapterFactory.createIfNotExists(Account.adapterName)
    const record = await adapter.findByParam('profile.email', login)

    if (record) {
      return new Account(record)
    }

    logger.debug(`Account '${login}' not fount`)
  }

  static findAccount: FindAccount = async (ctx, sub, token) => {
    logger.debug(`Find account '${sub}'`)
    const record = {
      accountId: sub
    }

    // Check token data
    if (!token || !token.sessionUid || !token.clientId || !token.scope) {
      return undefined
    }

    // Get session
    const session = await ctx.oidc.provider.Session.findByUid(token.sessionUid)
    if (!session) {
      return undefined
    }

    // const adapter = adapterFactory.createIfNotExists(Account.adapterName)
    // const record = await adapter.find(sub)

    // Get client metadata
    const meta = session.metaFor(token.clientId)
    if (!meta || !meta[token.scope]) {
      logger.debug(`Account '${sub}' not fount`)
      return undefined
    }
    const accountMeta = JSON.parse(Buffer.from(meta[token.scope], 'base64').toString('utf8'))

    return new Account({ ...accountMeta, ...record })
  }
}
