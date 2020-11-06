import { ErrorRequestHandler, RequestHandler } from "express"
import { strict as assert } from "assert"
import * as querystring from "querystring"
import { inspect } from "util"
import { isEmpty } from "lodash"
import Provider, { KoaContextWithOIDC, errors as oidcErrors } from "oidc-provider"

import logger from "../logger"
import Account from "../account"
import config from "../config"
import { AccountNotFount, IncorrectPassword } from "../error"


const { SessionNotFound } = oidcErrors
const keys = new Set()
const debug = (obj) => querystring.stringify(Object.entries(obj).reduce((acc, [key, value]) => {
    keys.add(key)
    if (isEmpty(value)) return acc
    acc[key] = inspect(value, { depth: null })
    return acc
}, {}), '<br/>', ': ', {
    encodeURIComponent(value) { return keys.has(value) ? `<strong>${value}</strong>` : value },
})


export default class InteractionController {

    constructor(protected provider: Provider) { }

    handleInteraction: RequestHandler = async (req, res, next) => {
        const {
            uid, prompt, params, session,
        } = await this.provider.interactionDetails(req, res)

        const client = await this.provider.Client.find(params.client_id)
        const options = {
            client,
            uid,
            details: prompt.details,
            params,
            title: 'Sign-in',

            // Debug info
            isProd: config.isProd,
            session: session ? debug(session) : undefined,
            dbg: {
                params: debug(params),
                prompt: debug(prompt),
            },
        }

        switch (prompt.name) {
            case 'select_account': {
                logger.debug(`Select account interaction received`)
                if (!session) {
                    return this.provider.interactionFinished(req, res, { select_account: {} }, {
                        mergeWithLastSubmission: false })
                }

                // Types from oidc provider force this cast
                const ctx: KoaContextWithOIDC = undefined as any
                const account = await this.provider.Account.
                    findAccount(ctx, session.accountId.toString())

                // TODO: Check undefined account
                if(!account) return
                const { email } = await account.claims('prompt', 'email', { email: null }, [])

                return res.render('select_account', {
                    ...options,
                    email,
                })
            }

            case 'login': {
                logger.debug(`Login interaction received`)
                return res.render('login', options)
            }

            case 'consent': {
                logger.debug(`Consent interaction received`)
                return res.render('interaction', {
                    ...options,
                    title: 'Authorize',
                })
            }

            default:
                return undefined
        }
    }

    login: RequestHandler = async (req, res, next) => {
        const { prompt: { name } } = await this.provider.interactionDetails(req, res)
        assert.equal(name, 'login')

        logger.debug(`Check login for "${req.body.login}"`)
        const account = await Account.findByLogin(req.body.login)
        if(!account) {
            throw new AccountNotFount(req.body.login)
        }

        if(!await account.checkPassword(req.body.password)) {
            throw new IncorrectPassword(req.body.login)
        }

        const result = {
            select_account: {}, // make sure its skipped by the interaction policy since we just logged in
            login: {
                account: account.accountId,
            },
        }

        await this.provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false })
    }

    continue: RequestHandler = async (req, res, next) => {
        const interaction = await this.provider.interactionDetails(req, res)
        const { prompt: { name } } = interaction
        assert.equal(name, 'select_account')

        if (req.body.switch) {
            if (interaction.params.prompt) {
                const prompts = new Set(interaction.params.prompt.split(' '))
                prompts.add('login')
                interaction.params.prompt = [...prompts].join(' ')
            } else {
                interaction.params.prompt = 'login'
            }
            await interaction.save()
        }

        const result = { select_account: {} }
        await this.provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false })
    }

    confirm: RequestHandler = async (req, res, next) => {
        const { prompt: { name } } = await this.provider.interactionDetails(req, res)
        assert.equal(name, 'consent')

        const consent = {
            // any scopes you do not wish to grant go in here
            //   otherwise details.scopes.new.concat(details.scopes.accepted) will be granted
            rejectedScopes: [],

            // any claims you do not wish to grant go in here
            //   otherwise all claims mapped to granted scopes
            //   and details.claims.new.concat(details.claims.accepted) will be granted
            rejectedClaims: [],

            // replace = false means previously rejected scopes and claims remain rejected
            // changing this to true will remove those rejections in favour of just what you rejected above
            replace: false
        }

        const result = { consent }
        await this.provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true })
    }

    abort: RequestHandler = async (req, res, next) => {
        const result = {
            error: 'access_denied',
            error_description: 'End-User aborted interaction',
        }
        await this.provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false })
    }


    onError: ErrorRequestHandler = async (err, req, res, next) => {
        if (err instanceof SessionNotFound) {
            // handle interaction expired / session not found error
            return res.status(401).send("<strong>The session has been expired</strong>")
        } else if(err instanceof AccountNotFount || err instanceof IncorrectPassword) {
            return res.status(404).send(`<strong>${err.message}</strong>`)
        } else {
            next(err)
        }
    }
}
