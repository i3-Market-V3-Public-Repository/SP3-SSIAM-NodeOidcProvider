import { Issuer } from 'openid-client'

import config from '../src/config'

main().catch(onError)

/// ///////

async function main () {
  console.log(config.issuer)
  const issuer = await Issuer.discover(`${config.issuer}/oidc`)
  console.log(issuer)
  const client = new issuer.Client({
    client_id: 'oidcCLIENT',
    client_secret: 'supersecret',
    redirect_uris: ['http://localhost:3001/oidcLogin'],
    response_types: ['code']
  })
}

function onError (err: Error) {
  console.error(err)
}
