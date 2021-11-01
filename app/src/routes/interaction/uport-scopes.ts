import { Credentials } from 'uport-credentials'

import { trust } from '@i3-market/security'

type DisclosureRequestParams = NonNullable<Parameters<Credentials['createDisclosureRequest']>[0]>
interface DisclosureRequestClaimsMap {
  [scope: string]: DisclosureRequestParams['claims']
}

// TODO: Cannot use the uport type because it is inconsistent!
// type ThenArg<T> = T extends PromiseLike<infer U> ? U : T
// type DisclosureResponse = ThenArg<ReturnType<Credentials['authenticateDisclosureResponse']>>
type DisclosureResponse = any

interface VerifiedClaims {
  trusted: []
  untrusted: []
}

export interface UportClaims {
  sub: string
  verifiedClaims: VerifiedClaims
  nonProvided: string[]
  rejectedScopes: string[]
  [key: string]: any
}

const scopeToClaims: DisclosureRequestClaimsMap = {
  // User info claims
  // Profile Scope
  // NOTE: uPort option essential can be only true or undefined. If set to false, the response JWT signature is invalid!
  profile: {
    verifiable: {},
    user_info: {
      name: { reason: 'Show your name to other users' },
      // email: { essential: true, reason: 'Share your email' },
      country: null
    }
  }
}

export function disclosureArgs (scopes: string[]): DisclosureRequestParams {
  const claims = scopes.reduce((prev, scope): DisclosureRequestParams['claims'] => {
    let curr: DisclosureRequestParams['claims'] | undefined

    // Standard policy: If a scope starts with vc, ask uPort for a verifiable claim with this name
    if (scope.startsWith('vc:')) {
      const claimName = scope.substring(3)
      curr = {
        verifiable: {
          [claimName]: { reason: `Optionaly demonstrate that you have a vc called ${claimName}` }
        }
      }
    } else if (scope.startsWith('vce:')) {
      const claimName = scope.substring(4)
      curr = {
        verifiable: {
          [claimName]: { essential: true, reason: `Demonstrate that you have a vc called ${claimName}` }
        }
      }
    } else {
      curr = scopeToClaims[scope]
    }

    if (curr === undefined) {
      return prev
    }

    return {
      verifiable: { ...prev.verifiable, ...curr.verifiable },
      user_info: { ...prev.user_info, ...curr.user_info }
    }
  }, { verifiable: {}, user_info: {} })

  return { claims }
}

export function fetchClaims (scopes: string[], disclosureRes: DisclosureResponse): UportClaims {
  console.log(scopes)
  console.log(disclosureRes)
  
  const claims: UportClaims = {
    sub: disclosureRes.did,
    verifiedClaims: {
      trusted: [],
      untrusted: []
    },
    rejectedScopes: [],
    nonProvided: []
  }

  scopes.forEach((scope) => {
    switch (scope) {
      case 'profile':
        claims.profile = {
          name: disclosureRes.name
        }
        break

      // Check verifiable claims
      default:
        if (scope.startsWith('vc:')) {
          const vcName = scope.substring(3)
          const vc = disclosureRes.verified.find(vc => vc.claim[vcName] !== undefined)
          if (vc === undefined) {
            claims.nonProvided.push(vcName)
          }
        }

        /**
         * Reject the scope if:
         *  1. Check vce are placed in the verified array!
         *  2. Verify issuers
         */
        if (scope.startsWith('vce:')) {
          const vcName = scope.substring(4)
          const vc = disclosureRes.verified.find(vc => vc.claim[vcName] !== undefined)
          if (vc === undefined || !trust.isTrustedDid(vc.iss)) {
            claims.rejectedScopes.push(scope)
          }
        }

        break
    }
  })

  claims.verifiedClaims.trusted = disclosureRes.verified?.filter((vc) => trust.isTrustedDid(vc.iss))
  claims.verifiedClaims.untrusted = disclosureRes.verified?.filter((vc) => !trust.isTrustedDid(vc.iss))
  console.log('claims')
  console.log(claims)
  return claims
}
