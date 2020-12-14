const clients = [
  {
    _id: 'oidcCLIENT',
    payload: {
      client_id: 'oidcCLIENT',
      client_secret: 'supersecret',
      grant_types: [
        'refresh_token',
        'authorization_code',
        // 'implicit'
      ],
      redirect_uris: [
        // 'https://somewhere.i3-market.eu/oidcLogin',
        'http://oidc-rp:7080/oauth/callback',
        'http://keycloak:8080/auth/realms/master/broker/oidc/endpoint',
      ],
      post_logout_redirect_uris: [
        "http://oidc-rp:7080/logout/callback"
      ],
      token_endpoint_auth_method: 'none'
    }
  }
]

const profiles = [
  {
    email: 'test@i3-market.eu',
    password: '$2b$13$2Og4QICwbTPodaBa2BUInOp6lE3KTIIGaCIn3XJSCENgmAiUXajZG',
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