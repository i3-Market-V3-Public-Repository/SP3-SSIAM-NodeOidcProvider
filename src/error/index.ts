// tslint:disable: max-classes-per-file

export class AccountNotFount extends Error {
    constructor(public login: string) {
        super(`Account '${login}' not fount`)
    }
}

export class IncorrectPassword extends Error {
    constructor(public login: string) {
        super(`Incorrect password for '${login}'`)
    }
}
