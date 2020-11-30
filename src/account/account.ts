import { assign } from "lodash"
import { Account as IAccount, AccountClaims, CanBePromise, ClaimsParameterMember, FindAccount, AdapterPayload } from "oidc-provider"
import { compare } from "bcrypt"

import { adapterFactory } from "@i3-market/adapter"
import logger from "@i3-market/logger"


interface Profile {
    email: string
    password: string
}

export default class Account implements IAccount {
    accountId: string
    profile: Profile

    constructor(record: AdapterPayload) {
        assign(this, record)
        // record
    }

    claims(
        use: string,
        scope: string,
        claims: { [key: string]: ClaimsParameterMember | null; },
        rejected: string[]
    ): CanBePromise<AccountClaims> {
        return {
            sub: this.accountId,
            profile: {
                email: this.profile.email
            }
        }
    }

    async checkPassword(password: string): Promise<boolean> {
        return compare(password, this.profile.password)
    }

    static adapterName: string = "Account"

    static async findByLogin(login: string): Promise<Account | undefined> {
        const adapter = adapterFactory.createIfNotExists(Account.adapterName)
        const record = await adapter.findByParam("profile.email", login)

        if(record) {
            return new Account(record)
        }

        logger.debug(`Account '${login}' not fount`)
    }

    static findAccount: FindAccount = async (ctx, sub, token) => {
        logger.debug(`Find account '${sub}'`)
        const adapter = adapterFactory.createIfNotExists(Account.adapterName)
        const record = await adapter.find(sub)

        if (record) {
            return new Account(record)
        }

        logger.debug(`Account '${sub}' not fount`)
    }
}
