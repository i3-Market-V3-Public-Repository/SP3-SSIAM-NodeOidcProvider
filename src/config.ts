
class Config {
    protected defaults: {[key: string]: string}

    constructor() {
        this.defaults = {
            "NODE_ENV": "development",

            "OIDC_PROVIDER_ISSUER": "http://localhost:3000",
            "OIDC_PROVIDER_PORT": "3000",

            "OIDC_PROVIDER_DB_HOST": "localhost",
            "OIDC_PROVIDER_DB_PORT": "27017",

            "COOKIES_KEYS": "gqmYWsfP6Dc6wk6J,Xdmqh4JBDuAc43xt,8WxYvAGmPuEvU8Ap",
            "JWKS_KEYS_PATH": "./misc/jwks.json"
        }
    }

    /**
     * Gets a configuration property comming from os environment or the
     * provided default configuration json file and casts the value.
     *
     * @param name Name of the property to get
     * @param convert Function to cast the value
     * @returns Return the property as string
     */
    get(name: string): string
    get<T>(name: string, convert: (value: string) => T): T
    get<T = string>(name: string, convert?: (value: string) => T): T {
        const value = process.env[name] || this.defaults[name] || ''
        if(!convert) {
            return value as unknown as T
        }

        return convert(value)
    }

    /**
     * @property Is production environment
     */
    get isProd(): boolean {
        return this.get("NODE_ENV", (v) => v === 'production')
    }

    /**
     * @property OpenID Connect Issuer
     */
    get issuer(): string {
        return this.get("OIDC_PROVIDER_ISSUER")
    }

    /**
     * @property Server port
     */
    get port(): number {
        return this.get("OIDC_PROVIDER_PORT", parseInt)
    }

    /**
     * @property Mongo connection URI
     */
    get mongoUri(): string {
        return [
            `mongodb://`,
            `${this.get("OIDC_PROVIDER_DB_USERNAME")}:${this.get("OIDC_PROVIDER_DB_PASSWORD")}@`,
            `${this.get("OIDC_PROVIDER_DB_HOST")}:${this.get("OIDC_PROVIDER_DB_PORT")}/`,
            `${this.get("OIDC_PROVIDER_DB_DATABASE")}?authSource=admin`,
        ].join('')
    }

    /**
     * @property Keys used by the OIDC to sign the cookies
     */
    get cookiesKeys(): string[] {
        return this.get("COOKIES_KEYS", (v) => v.split(","))
    }

    /**
     * @property Path for the jwks keys used by the OIDC
     */
    get jwksKeysPath(): string {
        return this.get("JWKS_KEYS_PATH")
    }
}

export default new Config()
