import { html } from "@benev/slate"
import { shadow_component } from "../../../../context/context.js"
import { styles } from "./styles.js"

import type { Audio ,Video ,Image , ImageFile ,VideoFile ,AudioFile} from "../../../omni-media/types.js"

import { showToast } from "../../../../utils/show-toast.js"

import loadingSvg from "../../../../icons/loading.svg.js"
import { GeneratePayload, ModelOption } from "../../types.js"

export const ModalUI = shadow_component((use) => {
  use.styles(styles)

  const media_controller = use.context.controllers.media
  const managers = use.context.controllers.compositor.managers
  const [media, setMedia, getMedia] = use.state<(Video | Image | Audio)[]>([])
  const [placeholders, setPlaceholders, getPlaceholders] = use.state<any[]>([])

  const optionsModel: Record<string, ModelOption> = {
    "ostris/qwen_image_edit_inpainting": {
      kind: "image",
      require: {
        prompt: true,
        image: true,
      },
    },
    "zai-org/CogVideoX1.5-5B": {
      kind: "video",
      require: {
        prompt: true,
        image: false,
      },
    },
  }

  const firstModelKey = Object.keys(optionsModel)[0];

  // controlled input state
  const [modalToken, setModalToken, getModalToken] = use.state<string>("")
  const [huggingfaceToken, setHuggingfaceToken ,getHuggingfaceToken] = use.state<string>("")
  const [triedSubmit, setTriedSubmit] = use.state<boolean>(false)
  const [prompt , setPrompt , getPrompt] = use.state<string|null>(null)
  const [selectedHash, setSelectedHash, getSelectedHash] = use.state<string | null>(null)

  const [model, setModel, getModel] = use.state<string>(firstModelKey)
  const [task , setTask , getTask] = use.state<string>(optionsModel[firstModelKey].kind);

  use.mount(() => {
      media_controller.getImportedFiles().then(async (media) => {
        setPlaceholders(Array.apply(null, Array(media.length)))
        const video_files = media.filter(({ kind }) => kind === "video") as VideoFile[]
        const image_files = media.filter(({ kind }) => kind === "image") as ImageFile[]
        const audio_files = media.filter(({ kind }) => kind === "audio") as AudioFile[]
        const video_elements = await media_controller.create_video_elements(video_files)
        const image_elements = media_controller.create_image_elements(image_files)
        const audio_elements = media_controller.create_audio_elements(audio_files)
        setMedia([...getMedia(), ...video_elements, ...image_elements, ...audio_elements])
        setPlaceholders([])
      })

      const unsub = media_controller.on_media_change(async (change) => {
        if(change.action === "added") {
          const video_files = change.files.filter(({ kind }) => kind === "video") as VideoFile[]
          const image_files = change.files.filter(({ kind }) => kind === "image") as ImageFile[]
          const audio_files = change.files.filter(({ kind }) => kind === "audio") as AudioFile[]
          const video_elements = await media_controller.create_video_elements(video_files)
          const image_elements = media_controller.create_image_elements(image_files)
          const audio_elements = media_controller.create_audio_elements(audio_files)
          setMedia([...getMedia(), ...video_elements, ...image_elements, ...audio_elements])
          const placeholders = [...getPlaceholders()]
          placeholders.pop()
          setPlaceholders(placeholders)
        }
        if(change.action === "removed") {
          change.files.forEach((file) => {
            const filtered = getMedia().filter((a) => a.hash !== file.hash)
            setMedia(filtered)
          })
        }
        if(change.action === "placeholder") {
          setPlaceholders([...getPlaceholders(), ...Array.apply(null, Array(1))])
        }
      })
      return () => unsub()
    })

  function isImage(m: Video | Image | Audio): m is Image {
    return m.kind === "image"
  }

  const render_image_element = (image: Image) => {
    const isSelected = getSelectedHash() === image.hash
    return html`
      <div
        class="media-card image-card ${isSelected ? "selected" : ""}"
        @click=${() => {
          if (isSelected) {
          setSelectedHash(null)
        } else {
          setSelectedHash(image.hash)
        }
        }}
      >
        <div class="media-element">
          ${image.element}
        </div>
        <div class="media-info">
          <span class="media-name" title="${image.file.name}">
            ${image.file.name}
          </span>
        </div>
      </div>
    `
  }

  const isValid = () => modalToken.trim().length > 0 && huggingfaceToken.trim().length > 0

  const handleSave = () => {
    setTriedSubmit(true)

    if (!isValid()) {
      showToast("Please fill both Modal Token and Huggingface Token." ,"warning")
      return
    }

    localStorage.setItem("modal_token", modalToken)
    localStorage.setItem("hf_token", huggingfaceToken)

    console.log("Tokens saved:", { modalToken, huggingfaceToken })
    showToast("Tokens saved", "info")
  }

  const handleGenerate = () => {

    // 1. validate tokens
    if (!isValid()) {
      showToast("Please fill both Modal Token and Huggingface Token.", "warning")
      return
    }

    // 2. get selected image
    const selected = getMedia().find(m => m.hash === getSelectedHash())
    const currentPrompt = getPrompt()

    if (!selected && !currentPrompt) {
      showToast("Please provide a prompt or select an image.", "warning")
      return
    }
    if (!getModel()) {
      showToast("Please provide a model" ,"warning")
      return
    }

    const payload: GeneratePayload = {
      tokens: {
        modal: getModalToken(),
        huggingface: getHuggingfaceToken(),
      },
      prompt: currentPrompt || null,
      image: selected?.kind === "image" ? {
        name: (selected as Image).file.name,
        url: (selected as Image).url,
        hash: selected.hash,
      } : null,
      model: getModel(),
    }

    console.log("Prepared payload:", payload)

    // show feedback
    showToast("Payload ready for API call", "info")

    // later: call your API
    // api.generateVideo(payload).then(...)
  }

  return html`
    <div class="modal-ui">
      <div class="main">
        <h1>Modal</h1>
        <p class="muted">
          In order to generate a video, please fill the required fields below.
        </p>
        <sl-details summary="Config" class="config-figure">
          <div class="config-input-wrapper">
            <sl-input
              type="text"
              size="small"
              placeholder="Enter modal token"
              label="Modal Token"
              class="config-input"
              .value=${modalToken}
              @sl-input=${(e: Event) => {
                const t = e.target as HTMLInputElement
                setModalToken(t.value)
              }}
            ></sl-input>

            <sl-input
              type="text"
              size="small"
              placeholder="Enter Huggingface token"
              label="Huggingface Token"
              class="config-input"
              .value=${huggingfaceToken}
              @sl-input=${(e: Event) => {
                const t = e.target as HTMLInputElement
                setHuggingfaceToken(t.value)
              }}
            ></sl-input>
            <sl-select
              label="Select Task"
              value=${task}
              @sl-change=${(e: Event) => {
                const t = e.target as HTMLSelectElement
                setTask(t.value)

                const firstMatch = Object.keys(optionsModel).find(
                  key => optionsModel[key].kind === t.value
                )
                if (firstMatch) setModel(firstMatch)
                if (!optionsModel[t.value].require.image) {
                  setSelectedHash(null)
                }
              }}
              size="small"
              class="config-input"
            >
              <sl-option value="image">Image</sl-option>
              <sl-option value="video">Video</sl-option>
            </sl-select>
            <sl-select
              label="Choose Model"
              value=${model}
              @sl-change=${(e: Event) => {
                const t = e.target as HTMLSelectElement
                setModel(t.value)

                if (!optionsModel[t.value].require.image) {
                  setSelectedHash(null)
                }
              }}
              size="small"
              class="config-input"
            >
              ${Object.entries(optionsModel)
              .filter(([_, opt]) => opt.kind === getTask()) // filter by task
              .map(([key]) => html`
                <sl-option value=${key}>${key}</sl-option>
              `)}
            </sl-select>

          </div>

          <div class="config-actions">
            <sl-button
              size="small"
              variant="primary"
              @click=${handleSave}
            >
              Start Server
            </sl-button>
            <sl-button
              size="small"
              variant="default"
              @click=${() => {
                // cancel function (disable why waiting server to start)
              }}
            >
              Reset
            </sl-button>

            <sl-button
              size="small"
              variant="default"
              @click=${() => {
                setModalToken("")
                setHuggingfaceToken("")
                setTriedSubmit(false)
              }}
            >
              Reset
            </sl-button>
          </div>
        </sl-details>
        <sl-details summary="Detail">
          <sl-textarea
            placeholder="Describe your video idea…"
            label="Prompts"
            .value=${prompt}
            ?disabled=${!optionsModel[getModel()].require.prompt}
            required=${optionsModel[getModel()].require.prompt}
            @sl-input=${(e: Event) => {
              const t = e.target as HTMLInputElement
              setPrompt(t.value)
            }}
          >
          </sl-textarea>
          <div class="media-grid ${!optionsModel[getModel()].require.image ? 'disabled' : ''}">
            ${placeholders.map(
              (_) => html`
              <div class="media-card placeholder">
                <div class="placeholder-animation">
                  ${loadingSvg}
                </div>
              </div>
            `,
            )}
            ${media.filter(isImage).map(img => render_image_element(img))}

          </div>
          <sl-button
            size="medium"
            variant="default"
            @click=${handleGenerate}
            class="btn-generate"
          >
            generate
          </sl-button>
        </sl-details>
      </div>
      <div class="video-preview">

      </div>
    </div>
  `
})

// register so <modal-ui> works in templates
customElements.define("modal-ui", ModalUI)
