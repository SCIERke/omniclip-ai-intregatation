import {html} from "@benev/slate"
import {shadow_view, shadow_component} from "../../context/context.js"
import type {PanelProps} from "@benev/construct"
import { Video, Image, Audio } from "../omni-media/types.js"
import { styles } from "./styles.js"
import { AwsUI } from "./providers/aws/ui.js"
import { ModalUI } from "./providers/modal/ui.js"

export const VideoGeneratorView = shadow_view((use) => (props: PanelProps) => {
  use.watch(() => use.context.state)
  use.styles(styles)

  // Form state
  const media_controller = use.context.controllers.media
  const managers = use.context.controllers.compositor.managers
  const [media, setMedia, getMedia] = use.state<(Video | Image | Audio)[]>([])
  const [selectedOption, setSelectedOption ] = use.state<string>("modal");


  const optionsWithFunction: Record<string, any> = {
    modal: ModalUI,
    aws: AwsUI
  }


  return html`
    <div class="video-generator">
      <h2>Video Generator Form</h2>

      <sl-select
        @sl-change=${(e: Event) => {
          const select = e.target as HTMLSelectElement;
          setSelectedOption(select.value);
        }}
        placeholder="no text selected"
        value=${selectedOption}
        class="select-option"
        label="Select text"
        help-text="If you want more providers contact me!"
        size="small"
      >
        ${Object.keys(optionsWithFunction).map((option, index) => html`
          <sl-option value=${option} key=${index}>
            ${option}
          </sl-option>
        `)}
      </sl-select>

       <div class="main-part">
        ${selectedOption === "modal" ? html`<modal-ui></modal-ui>` : ""}
        ${selectedOption === "aws"   ? html`<aws-ui></aws-ui>`     : ""}
      </div>

      <sl-button @click=${() => console.log(selectedOption)}>Log Button</sl-button>
    </div>
  `
})
