
export interface RegisterResponse {
  clientId: string
  redirectUris: string[]
  postLogoutRedirectUris?: string[]
}

export interface RegisterRequest extends RegisterResponse {
  clientSecret: string
}
