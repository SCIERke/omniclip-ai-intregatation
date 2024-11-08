import {Op, html, watch} from "@benev/slate"

import {styles} from "./styles.js"
import {shadow_view} from "../../../../context/context.js"
import saveSvg from "../../../../icons/gravity-ui/save.svg.js"
import exportSvg from "../../../../icons/gravity-ui/export.svg.js"
import {StateHandler} from "../../../../views/state-handler/view.js"

export const Export = shadow_view(use => () => {
	use.styles(styles)
	use.watch(() => use.context.state)

	const compositor = use.context.controllers.compositor
	const video_export = use.context.controllers.video_export
	const state = use.context.state
	const [logs, setLogs, getLogs] = use.state<string[]>([])

	const [bitrate, setBitrate] = use.state(9000)

	use.mount(() => {
		const dispose = watch.track(() => use.context.state.log, (log) => {
			if(getLogs().length === 20) {
				const new_arr = getLogs().slice(1)
				setLogs(new_arr)
			}
			setLogs([...getLogs(), log])
		})
		return () => dispose()
	})

	if(use.context.state.is_exporting) {
		const dialog = use.shadow.querySelector("dialog")
		dialog?.showModal()
	}

	return StateHandler(Op.all(
		use.context.helpers.ffmpeg.is_loading.value,
		use.context.is_webcodecs_supported.value), () => html`
		<div class="flex">
			<dialog @cancel=${(e: Event) => e.preventDefault()}>
				<div class="box">
					${state.is_exporting
						? html`
							${compositor.canvas_element}
						`
						: null}
					<div class=progress>
						<div class=stats>
							<span class=percentage>
								Progress ${state.export_status === "complete" || state.export_status === "flushing"
									? "100"
									: state.export_progress.toFixed(2)}
								%
							</span>
							<span class=status>Status: ${state.export_status}</span>
						</div>
						<div class=progress-bar>
							<div
								class="bar"
								style="
									width: ${state.export_status === "complete" || state.export_status === "flushing"
										? "100"
										: state.export_progress.toFixed(2)
								}%"
							>
							</div>
						</div>
						<div class=buttons>
							<button class=cancel>Cancel Export</button>
							<button
								@click=${() => video_export.save_file()}
								class="sparkle-button save-button"
								.disabled=${state.export_status !== "complete"}
							>
								<span  class="spark"></span>
								<span class="backdrop"></span>
								${saveSvg}
								<span class=text>save</span>
							</button>
						</div>
					</div>
				</div>
			</dialog>
			<h2>Export Settings</h2>
			<h4>Bitrate (kbps)</h4>
			<div class="setting-container flex">
				<input @input=${(e: InputEvent) => setBitrate(+(e.currentTarget as HTMLInputElement).value)} class="bitrate" value="${bitrate}" min="1" type="number">
				${bitrate <= 0 ? html`<span class="error">bitrate must be higher than 0</span>` : null}
			</div>
			<div class=export>
				<span class=info>${`${state.settings.width}x${state.settings.height}`}@${state.timebase}fps</span>
				<button ?disabled=${bitrate <= 0} class="sparkle-button" @click=${() => video_export.export_start(use.context.state, bitrate)}>
					<span class="text">${exportSvg}<span>Export</span></span>
				</button>
			</div>
		</div>
	`)
})
