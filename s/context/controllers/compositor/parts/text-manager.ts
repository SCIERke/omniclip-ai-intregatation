import {generate_id} from "@benev/slate"
import {FabricText} from "fabric/dist/index.mjs"

import {Compositor} from "../controller.js"
import {Actions} from "../../../actions.js"
import {FontMetadata} from "../../../global.js"
import {Font, FontStyle, TextAlign, TextEffect, State} from "../../../types.js"
import {find_place_for_new_effect} from "../../timeline/utils/find_place_for_new_effect.js"

export class TextManager extends Map<string, FabricText> {
	#clicked_effect: TextEffect | null = null
	#setPermissionStatus: (() => void) | null = null
	#permissionStatus: PermissionStatus | null = null

	constructor(private compositor: Compositor, private actions: Actions) {super()}

	create_and_add_text_effect(state: State) {
		const effect: TextEffect = {
			id: generate_id(),
			kind: "text",
			start_at_position: 0,
			duration: 5000,
			start: 0,
			end: 5000,
			track: 0,
			size: 38,
			content: "example",
			style: "normal",
			font: "Lato",
			color: "#e66465",
			align: "center",
			rect: {
				position_on_canvas: {
					x: 100,
					y: 50,
				},
				scaleX: 1,
				scaleY: 1,
				width: 100,
				height: 20,
				rotation: 0,
			}
		}
		const {position, track} = find_place_for_new_effect(state.effects, state.tracks)
		effect.start_at_position = position!
		effect.track = track
		this.add_text_effect(effect)
	}

	add_text_effect(effect: TextEffect, recreate?: boolean) {
		const {size, color, content} = effect
		const text = new FabricText(content, {
			fill: color,
			fontSize: size,
			objectCaching: false,
			scaleX: effect.rect.scaleX,
			scaleY: effect.rect.scaleY,
			top: effect.rect.position_on_canvas.y,
			left: effect.rect.position_on_canvas.x,
			angle: effect.rect.rotation,
			effect: {...effect}
		})
		this.set(effect.id, text)
		if(recreate) {return}
		this.actions.add_text_effect(effect)
	}

	add_text_to_canvas(effect: TextEffect) {
		const max_track = 4 // lower track means it should draw on top of higher tracks, although moveObjectTo z-index works in reverse
		const text = this.get(effect.id)!
		this.compositor.canvas.add(text)
		this.compositor.canvas.moveObjectTo(text, max_track - effect.track)
		this.compositor.canvas.renderAll()
	}

	remove_text_from_canvas(effect: TextEffect) {
		const text = this.get(effect.id)!
		this.compositor.canvas.remove(text)
		this.compositor.canvas.renderAll()
	}

	measure_text_width (content: string, size: number, font: Font, color: string) {
		this.compositor.ctx!.font = `${size}px ${font}`;
		this.compositor.ctx!.fillStyle = color;
		return this.compositor.ctx?.measureText(content).width!
	}

	measure_text_height(content: string) {
		return this.compositor.ctx?.measureText(content).actualBoundingBoxAscent! + this.compositor.ctx?.measureText(content).actualBoundingBoxDescent!
	}

	set_text_font(effect: TextEffect, font: string, update_compositor: () => void) {
		this.actions.set_text_font(effect, font)
		this.#clicked_effect!.font = font
		const text = this.compositor.canvas.getActiveObject()! as FabricText
		text.set("fontFamily", font)
		update_compositor()
	}

	set_font_size(effect: TextEffect, size: number, update_compositor: () => void) {
		this.actions.set_font_size(effect, size)
		this.#clicked_effect!.size = size
		const text = this.compositor.canvas.getActiveObject()! as FabricText
		text.set("fontSize", size)
		this.#update_text_rect()
		update_compositor()
	}

	set_font_style(effect: TextEffect, style: FontStyle, update_compositor: () => void) {
		this.actions.set_font_style(effect, style)
		this.#clicked_effect!.style = style
		const text = this.compositor.canvas.getActiveObject()! as FabricText
		text.set("fontStyle", style)
		update_compositor()
	}

	set_text_align(effect: TextEffect, align: TextAlign, update_compositor: () => void) {
		this.actions.set_text_align(effect, align)
		this.#clicked_effect!.align = align
		const text = this.compositor.canvas.getActiveObject()! as FabricText
		text.set("textAlign", align)
		update_compositor()
	}

	set_text_color(effect: TextEffect, color: string, update_compositor: () => void) {
		this.actions.set_text_color(effect, color)
		const text = this.compositor.canvas.getActiveObject()! as FabricText
		text.set("fill", color)
		update_compositor()
	}

	set_text_content(effect: TextEffect, content: string, update_compositor: () => void) {
		this.actions.set_text_content(effect, content)
		this.#clicked_effect!.content = content
		const text = this.compositor.canvas.getActiveObject()! as FabricText
		text.set("text", content)
		this.#update_text_rect()
		update_compositor()
	}

	set_clicked_effect(effect: TextEffect) {
		this.#clicked_effect = {...effect}
	}

	#update_text_rect() {
		const {content, size, font, color} = this.#clicked_effect!
		const width = this.measure_text_width(content, size, font, color)
		const height = this.measure_text_height(content)
		const rect = {
			...this.#clicked_effect!.rect,
			width,
			height
		}
		this.#clicked_effect!.rect = rect
		this.actions.set_text_rect(this.#clicked_effect!, {...rect})
	}

	destroy() {
		if(this.#setPermissionStatus) {
			this.#permissionStatus?.removeEventListener("change", this.#setPermissionStatus)
		}
	}

	async getFonts(onPermissionStateChange: (state: PermissionState, deniedStateText: string, fonts?: FontMetadata[]) => void): Promise<FontMetadata[]> {
		//@ts-ignore
		const permissionStatus = this.#permissionStatus = await navigator.permissions.query({ name: 'local-fonts' })
		const deniedStateText = "To enable local fonts, go to browser settings > site permissions, and allow fonts for this site."
		const setStatus = this.#setPermissionStatus = async () => {
			if(permissionStatus.state === "granted") {
				const fonts = await window.queryLocalFonts()
				onPermissionStateChange(permissionStatus.state, "", fonts)
			} else if (permissionStatus.state === "denied") {
				onPermissionStateChange(permissionStatus.state, deniedStateText)
			}
		}
		return new Promise((resolve, reject) => {
			if ('permissions' in navigator && 'queryLocalFonts' in window) {
				async function checkFontAccess() {
					try {
						permissionStatus.addEventListener("change", setStatus)
						if (permissionStatus.state === 'granted') {
							const fonts = await window.queryLocalFonts()
							resolve(fonts)
						} else if (permissionStatus.state === "prompt") {
							reject("User needs to grant permission for local fonts.")
						} else if(permissionStatus.state === "denied") {
							reject(deniedStateText)
						}
					} catch (err) {
						reject(err)
					}
				}
				checkFontAccess()
			} else {
				reject("Local Font Access API is not supported in this browser.")
			}
		})
	}
}
