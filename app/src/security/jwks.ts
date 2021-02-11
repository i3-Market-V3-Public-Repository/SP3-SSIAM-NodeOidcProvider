import generateKeyPair from 'jose/util/generate_key_pair'
import fromKeyLike, { JWK } from 'jose/jwk/from_key_like'
import config from '../config'
import { writeFile } from 'fs'
import path from 'path'

const rootDir = path.resolve(__dirname, '../..')

type JWSAlg = 'RS256' | 'RS384' | 'RS512' | 'PS256' | 'PS384' | 'PS512' | 'ES256' | 'ES256K' | 'ES384' | 'ES512' | 'EdDSA' | 'HS256' | 'HS384' | 'HS512' | 'none'

interface JwksOptions {
  alg: JWSAlg
  amount: number
  dstFilePath: string
}

const defaultOptions: JwksOptions = {
  alg: 'ES256',
  amount: 1,
  dstFilePath: config.jwksKeysPath
}
export const jwks = async (jwksOptions: Partial<JwksOptions>): Promise<void> => {
  const options: JwksOptions = {
    ...defaultOptions,
    ...jwksOptions
  }
  const jwks: JWK[] = []
  for (let i = 0; i < options.amount; i++) {
    const { privateKey } = await generateKeyPair(options.alg)
    const jwk = await fromKeyLike(privateKey)
    jwks.push(jwk)
  }
  return await new Promise((resolve, reject) => {
    writeFile(path.resolve(rootDir, options.dstFilePath), JSON.stringify(jwks), (err) => {
      if (err !== undefined) throw err as Error
      else return resolve()
    })
  })
}
