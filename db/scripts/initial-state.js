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
      ]
    }
  }
]


const profiles = [
  {
    email: 'test@i3-market.eu',
    password: '$2b$13$2Og4QICwbTPodaBa2BUInOp6lE3KTIIGaCIn3XJSCENgmAiUXajZG',
  }
]
