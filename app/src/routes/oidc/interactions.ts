import { interactionPolicy, Configuration } from 'oidc-provider'

export default (): Configuration['interactions'] => {
  const basePolicy = interactionPolicy.base()
  const loginAndConsent = new interactionPolicy.Prompt({ name: 'loginAndConsent' })

  for (const prompt of basePolicy) {
    for (const check of prompt.checks) {
      loginAndConsent.checks.add(check)
    }
  }

  return {
    policy: [loginAndConsent],
    url: (ctx, interaction) => {
      return `/release2/interaction/${ctx.oidc.uid}`
    }
  }
}
