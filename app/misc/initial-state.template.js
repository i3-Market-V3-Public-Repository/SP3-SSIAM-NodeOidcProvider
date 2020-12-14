const clients = [
  {
    _id: 'oidcCLIENT',
    payload: {
      client_id: 'oidcCLIENT',
      client_secret: 'supersecret',
      grant_types: [
        'refresh_token',
        'authorization_code'
        // 'implicit'
      ],
      redirect_uris: [
        'http://localhost:3001/oauth/callback', // Custom rp client used for testing
        'http://localhost:3002/auth/realms/master/broker/oidc/endpoint' // Keycloak rp client for testing
      ],
      post_logout_redirect_uris: [
        'http://localhost:3001/logout/callback'
      ]
    }
  }
]

const profiles = [
  {
    email: 'test@i3-market.eu',
    password: '$2b$13$2Og4QICwbTPodaBa2BUInOp6lE3KTIIGaCIn3XJSCENgmAiUXajZG'
  }
]
