const clients = [
  {
    _id: 'oidcRpAcg',
    payload: {
      client_id: 'oidcRpAcg',
      client_secret: 'supersecret',
      grant_types: [
        'authorization_code'
        // 'implicit'
      ],
      redirect_uris: [
        'http://localhost:3001/oidc/cb', // Custom rp client used for testing
        'http://localhost:3002/auth/realms/master/broker/oidc/endpoint', // Keycloak rp client for testing
        'http://localhost:4200/credential'
      ],
      post_logout_redirect_uris: [
        'http://localhost:3001/oidc/logout/cb'
      ],
      token_endpoint_auth_method: 'client_secret_jwt' // One of 'none' (PKCE required), 'client_secret_basic', 'client_secret_jwt', 'client_secret_post', 'private_key_jwt'
    }
  },
  {
    _id: 'oidcRpAcg_SpaNativeApps',
    payload: {
      client_id: 'oidcRpAcg_SpaNativeApps',
      client_secret: 'supersecret',
      grant_types: [
        'authorization_code'
        // 'implicit'
      ],
      redirect_uris: [
        'http://localhost:3001/oidc/cb', // Custom rp client used for testing
        'http://localhost:3002/auth/realms/master/broker/oidc/endpoint', // Keycloak rp client for testing
        'http://localhost:4200/credential'
      ],
      post_logout_redirect_uris: [
        'http://localhost:3001/oidc/logout/cb'
      ],
      token_endpoint_auth_method: 'none' // One of 'none' (PKCE required), 'client_secret_basic', 'client_secret_jwt', 'client_secret_post', 'private_key_jwt'
    }
  }
]

const profiles = [
  {
    email: 'test@i3-market.eu',
    password: '$2b$13$2Og4QICwbTPodaBa2BUInOp6lE3KTIIGaCIn3XJSCENgmAiUXajZG' // i3market
  }
]

// Insert clients
print('Inserting default clients')
db.client.insertMany(clients)

// Insert accounts
print("Inserting default administation accounts")
profiles.forEach((profile) => {
  const accountId = ObjectId().str
  db.account.insert({
    _id: accountId,
    payload: {
      accountId,
      profile
    }
  })
})
