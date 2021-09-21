import generateKeyPair from 'jose/util/generate_key_pair'
import fromKeyLike, { JWK } from 'jose/jwk/from_key_like'
import { AsymmetricSigningAlgorithm } from 'oidc-provider'
import config from '../config'
import { writeFile } from 'fs'
import path from 'path'
import logger from '@i3-market/logger'

const rootDir = path.resolve(__dirname, '../..')

interface JwksOptions {
  keys: AsymmetricSigningAlgorithm[]
  dstFilePath: string
}

const defaultOptions: JwksOptions = {
  keys: ['ES256'],
  dstFilePath: config.jwksKeysPath
}
export const jwks = async (jwksOptions: Partial<JwksOptions>): Promise<void> => {
  const options: JwksOptions = {
    ...defaultOptions,
    ...jwksOptions
  }
  const jwks: JWK[] = []
  logger.info('Generating keys:')
  for (let i = 0; i < options.keys.length; i++) {
    const keyAlg = options.keys[i]
    logger.info(`  - ${keyAlg}`)

    const key = (await generateKeyPair(keyAlg)).privateKey
    const jwk = await fromKeyLike(key)
    jwk.use = 'sig'
    jwks.push(jwk)
  }
  return await new Promise((resolve, reject) => {
    writeFile(path.resolve(rootDir, options.dstFilePath), JSON.stringify(jwks), (err) => {
      if (err !== null && err !== undefined) throw err as Error
      else return resolve()
    })
  })
}
