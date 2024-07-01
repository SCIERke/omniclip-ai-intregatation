import {Status} from "../../context/types.js"
import MP4Box, {MP4File, MP4Info, MP4MediaTrack} from "./mp4box.adapter.js"

type SetStatus = (status: Status, message: string) => void
type OnChunk = (chunk: EncodedVideoChunk) => void
type OnConfig = (config: VideoDecoderConfig) => void

export class MP4FileSink {
	#setStatus: SetStatus
	#file: MP4File
	#offset = 0

	constructor(file: MP4File, setStatus: SetStatus) {
		this.#file = file
		this.#setStatus = setStatus
	}

	write(chunk: ArrayBuffer) {
		const buffer = new ArrayBuffer(chunk.byteLength)
		//@ts-ignore
		new Uint8Array(buffer).set(chunk)
		//@ts-ignore
		buffer.fileStart = this.#offset
		this.#offset += buffer.byteLength
		this.#setStatus("fetch", (this.#offset / (1024 ** 2)).toFixed(1) + " MiB")!
		//@ts-ignore
		this.#file!.appendBuffer(buffer)
	}

	close() {
		this.#setStatus("fetch", "Done")
		this.#file.flush()
	}
}

export class MP4Demuxer {
	#onConfig: OnConfig
	#onChunk: OnChunk
	#setStatus: SetStatus
	#framesCount: (frames: number) => void
	#file: MP4File

	constructor(file: File, {onConfig, onChunk, setStatus, framesCount}: {onConfig: OnConfig, onChunk: OnChunk, setStatus: SetStatus, framesCount: (frames: number) => void}) {
		this.#onConfig = onConfig
		this.#onChunk = onChunk
		this.#setStatus = setStatus
		this.#framesCount = framesCount

		this.#file = MP4Box.createFile()
		this.#file.onError = error => setStatus("demux", error)
		this.#file.onReady = this.#onReady.bind(this)
		this.#file.onSamples = this.#onSamples.bind(this)
		const fileSink = new MP4FileSink(this.#file, setStatus)
		file.stream().pipeTo(new WritableStream(fileSink, {highWaterMark: 1}))
	}

	#description(track: MP4MediaTrack) {
		const trak = this.#file.getTrackById(track.id)
		for (const entry of trak.mdia!.minf!.stbl!.stsd!.entries) {
		//@ts-ignore
			const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C
			if (box) {
				//@ts-ignore
				const stream = new MP4Box.DataStream(undefined, 0, MP4Box.DataStream.BIG_ENDIAN)
				box.write(stream)
				return new Uint8Array(stream.buffer!, 8)  // Remove the box header.
			}
		}
		throw new Error("avcC, hvcC, vpcC, or av1C box not found")
	}

	#onReady(info: MP4Info) {
		this.#setStatus("demux", "Ready")
		const track = info.videoTracks[0]
		this.#onConfig({
			codec: track.codec.startsWith('vp08') ? 'vp8' : track.codec,
			codedHeight: track.video.height,
			codedWidth: track.video.width,
			description: this.#description(track),
		});
		this.#framesCount(track.nb_samples)
		this.#file.setExtractionOptions(track.id)
		this.#file.start()
	}

	#onSamples(track_id: number, ref: any, samples: any) {
		for (const sample of samples) {
			this.#onChunk(new EncodedVideoChunk({
				type: sample.is_sync ? "key" : "delta",
				timestamp: 1e6 * sample.cts / sample.timescale,
				duration: 1e6 * sample.duration / sample.timescale,
				data: sample.data
			}))
		}
	}
}


