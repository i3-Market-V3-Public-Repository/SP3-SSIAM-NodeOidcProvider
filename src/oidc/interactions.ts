import { interactionPolicy, Configuration } from "oidc-provider"


const interactions: Configuration["interactions"] = {
  policy: interactionPolicy.base(),
  url: (ctx, interaction) => {
    return `/interaction/${ctx.oidc.uid}`
  }
}

export default interactions
