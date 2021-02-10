
export interface RegisterResponse {
  clientId: string
  tokenEndpointAuthMethod: string
  redirectUris: string[]
  postLogoutRedirectUris?: string[]
}

export interface RegisterRequest extends RegisterResponse {
  clientSecret: string
}
