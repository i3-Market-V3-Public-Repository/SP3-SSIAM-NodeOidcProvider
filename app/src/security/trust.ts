import config from '../config'

export const trust = {
  /**
   * Check if a did can be trusted
   * @param did Did to be checked
   * @returns True if the did can be trusted
   */
  isTrustedDid (did: string, whitelist = config.whitelist): boolean {
    return whitelist.includes(did)
  }
}
