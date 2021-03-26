import logger from '@i3-market/logger'
import config from '../config'

export const trust = {
  /**
   * Check if a did can be trusted
   * @param did Did to be checked
   * @returns True if the did can be trusted
   */
  isTrustedDid (did: string, whitelist = config.whitelist): boolean {
    if (whitelist === undefined) {
      logger.warn('The file whitelist.js is missing so you do not trust any verifiable-credentials\' issuer. An example file would be')
      logger.warn(`
// Export my identity + a static list
const whitelist = [
  // Append here as many DIDs as you want. Example:
//   'did:ethr:0xe6f2be80ed5521529f67b39a74aa428282cf0312'
]

// Comment following names to exclude OIDC Provider identity
const identity = require('./identity.json') // Path to the JSON file with your OIDC provider DID
whitelist.push(identity.did)  // You likely want to trust your OIDC provider as a valid credential issuer

module.exports = whitelist
      `)
      return false
    }
    return whitelist.includes(did)
  }
}
