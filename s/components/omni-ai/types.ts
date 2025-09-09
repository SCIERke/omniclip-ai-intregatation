export interface GeneratePayload {
  tokens: { modal: string; huggingface: string }
  prompt: string | null
  image: { name: string; url: string; hash: string } | null
  model: string
}

interface ModelRequirements {
  prompt: boolean
  image: boolean
}

export interface ModelOption {
  kind: "image" | "video" | "audio"
  require: ModelRequirements
}