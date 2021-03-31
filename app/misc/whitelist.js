// !!-------------------------------------------------------------------------!!
// ! NOTE: Do not commit changes on this file unless it is strictly necessary  !
// !!-------------------------------------------------------------------------!!

// Export my identity + a static list
const whitelist = [
  // Append here as many DIDs as you want. Example:
//   'did:ethr:0xe6f2be80ed5521529f67b39a74aa428282cf0312',
]

// Comment following names to exclude OIDC Provider identity
const identity = require('./identity.json')
whitelist.push(identity.did)

module.exports = whitelist
