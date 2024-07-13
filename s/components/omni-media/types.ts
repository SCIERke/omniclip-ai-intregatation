export type MediaType = "Audio" | "Video" | "Image"

export interface MediaFile {
	hash: string
	file: File
}

export type AnyMedia = AudioFile | VideoFile | ImageFile

export interface VideoFile extends MediaFile {
	kind: "video"
	frames: number
	duration: number
}

export interface AudioFile extends MediaFile {
	kind: "audio"
}

export interface ImageFile extends MediaFile {
	kind: "image"
}

export interface Video extends VideoFile {
	element: HTMLVideoElement
	thumbnail: string
}

export interface Audio extends AudioFile {
	element: HTMLAudioElement
}

export interface Image extends ImageFile {
	element: HTMLImageElement
	url: string
}
