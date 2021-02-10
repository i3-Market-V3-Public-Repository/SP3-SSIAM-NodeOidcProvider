const clients = [
  {
    _id: 'oidcRpACG',
    payload: {
      client_id: 'oidcRpACG',
      client_secret: 'supersecret',
      grant_types: [
        'authorization_code'
        // 'implicit'
      ],
      redirect_uris: [
        'http://localhost:3001/oidc/cb', // Custom rp client used for testing
        'http://localhost:3002/auth/realms/master/broker/oidc/endpoint' // Keycloak rp client for testing
      ],
      post_logout_redirect_uris: [
        'http://localhost:3001/oidc/logout/cb'
      ],
      token_endpoint_auth_method: 'client_secret_jwt' // One of 'none' (for PKCE), 'client_secret_basic', 'client_secret_jwt', 'client_secret_post', 'private_key_jwt'
    }
  },
  {
    _id: 'oidcRpACGPkce',
    payload: {
      client_id: 'oidcRpACGPkce',
      client_secret: 'supersecret',
      grant_types: [
        'authorization_code'
        // 'implicit'
      ],
      redirect_uris: [
        'http://localhost:3001/oidc/cb', // Custom rp client used for testing
        'http://localhost:3002/auth/realms/master/broker/oidc/endpoint' // Keycloak rp client for testing
      ],
      post_logout_redirect_uris: [
        'http://localhost:3001/oidc/logout/cb'
      ],
      token_endpoint_auth_method: 'none' // One of 'none' (for PKCE), 'client_secret_basic', 'client_secret_jwt', 'client_secret_post', 'private_key_jwt'
    }
  }
]

const profiles = [
  {
    email: 'test@i3-market.eu',
    password: '$2b$13$2Og4QICwbTPodaBa2BUInOp6lE3KTIIGaCIn3XJSCENgmAiUXajZG' // i3market
  }
]

// Initialize database. This prevents this script from inserting the records many times
print("Initialize database...")
db.initialization.insert({
  creation: new Date()
})

// Insert clients
print("Insert default clients")
db.client.insertMany(clients)

// Insert accounts
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
