import { html } from "@benev/slate"
import { shadow_component } from "../../../../context/context.js"

export const AwsUI = shadow_component((use) => {
  use.watch(() => use.context.state)

  return html`
    <div class="aws-ui">
      <h3>AWS UI</h3>
      <p>This is the AWS interface</p>
    </div>
  `
})
customElements.define("aws-ui", AwsUI)
