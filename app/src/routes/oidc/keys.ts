import { loadJSON } from '@i3-market/util'
import config from '@i3-market/config'

let keys: [] | undefined
export default async (): Promise<any[]> => {
  if (keys === undefined) {
    keys = await loadJSON(config.jwksKeysPath)
  }
  if (keys === undefined) {
    throw new Error('JWKS file not fount')
  }
  return keys
}
