import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'
import { Credentials } from 'uport-credentials'

type Identity = ReturnType<typeof Credentials.createIdentity>
type ConvertFunction<T> = (value: string) => T

const readFilePromise = promisify(fs.readFile)
// type Identity = ReturnType<Credentials>

class Config {
  protected defaults: {[key: string]: string}

  constructor () {
    this.defaults = {
      NODE_ENV: 'development',

      OIDC_PROVIDER_ISSUER: 'https://localhost:3000',
      OIDC_PROVIDER_PORT: '3000',
      OIDC_PROVIDER_REVER_PROXY: '0',

      OIDC_PROVIDER_DB_HOST: 'localhost',
      OIDC_PROVIDER_DB_PORT: '27017',

      COOKIES_KEYS: 'gqmYWsfP6Dc6wk6J,Xdmqh4JBDuAc43xt,8WxYvAGmPuEvU8Ap',
      JWKS_KEYS_PATH: './misc/jwks.json',
      IDENTITY_PATH: './misc/identity.json',

      RPC_URL: 'https://rinkeby.infura.io/ethr-did',
      WHITELIST: './misc/whitelist.js'
    }
  }

  // Conversion functions
  protected fromBoolean: ConvertFunction<boolean> = (v) => v.toLocaleLowerCase() === '1'
  protected fromArray: ConvertFunction<string[]> = (v) => v.split(',')
  protected fromInteger: ConvertFunction<number> = parseInt
  protected fromImport: <T>(v: string) => T = (v) => { return require(path.join(__dirname, '../', v)) } // TODO: Only relative path supported

  /**
   * Gets a configuration property comming from os environment or the
   * provided default configuration json file and casts the value.
   *
   * @param name Name of the property to get
   * @param convert Function to cast the value
   * @returns Return the property as string
   */
  get (name: string): string
  get<T>(name: string, convert: (value: string) => T): T
  get<T = string>(name: string, convert?: ConvertFunction<T>): T {
    const value = process.env[name] ?? this.defaults[name] ?? ''
    if (convert == null) {
      return value as unknown as T
    }

    return convert(value)
  }

  /**
   * @property Is production environment
   */
  get isProd (): boolean {
    return this.get('NODE_ENV', (v) => v === 'production')
  }

  /**
   * @property OpenID Connect Issuer
   */
  get issuer (): string {
    return this.get('OIDC_PROVIDER_ISSUER')
  }

  /**
   * @property Server port
   */
  get port (): number {
    return this.get('OIDC_PROVIDER_PORT', this.fromInteger)
  }

  /**
   * @property Reverse proxy
   */
  get revereProxy (): boolean {
    return this.get('OIDC_PROVIDER_REVERSE_PROXY', this.fromBoolean)
  }

  /**
   * @property Mongo connection URI
   */
  get mongoUri (): string {
    return [
      'mongodb://',
            `${this.get('OIDC_PROVIDER_DB_USERNAME')}:${this.get('OIDC_PROVIDER_DB_PASSWORD')}@`,
            `${this.get('OIDC_PROVIDER_DB_HOST')}:${this.get('OIDC_PROVIDER_DB_PORT')}/`,
            `${this.get('OIDC_PROVIDER_DB_DATABASE')}?authSource=admin`
    ].join('')
  }

  /**
   * @property Keys used by the OIDC to sign the cookies
   */
  get cookiesKeys (): string[] {
    return this.get('COOKIES_KEYS', this.fromArray)
  }

  /**
   * @property Path for the jwks keys used by the OIDC
   */
  get jwksKeysPath (): string {
    return this.get('JWKS_KEYS_PATH')
  }

  /**
   * @property It is used to create tunnels so the OIDC server uses a public https domain when testing.
   */
  get useNgrok (): boolean {
    return this.get('OIDC_PROVIDER_NGROK', this.fromBoolean)
  }

  /**
   * @property Get identity promise. This identity contains a DID and its associated privateKey
   */
  get identityPromise (): Promise<Identity> {
    return readFilePromise(this.get('IDENTITY_PATH')).then((value) => {
      return JSON.parse(value.toString())
    })
  }

  /**
   * @property Get the RPC URL
   */
  get rpcUrl (): string {
    return this.get('RPC_URL')
  }

  /**
   * @property A list of the trusted
   */
  get whitelist (): string[] {
    return this.get<string[]>('WHITELIST', this.fromImport)
  }
}

export default new Config()
