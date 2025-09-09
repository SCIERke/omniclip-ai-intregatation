// panel.ts
import {html} from "@benev/slate"

import {panel, standard_panel_styles as styles} from "@benev/construct"
import AIPanelSvg from "../../icons/ai-icons/ai-panel.svg.js"
import {VideoGeneratorView} from "./view.js"
import { shadow_view } from "../../context/context.js"

export const AIPanel = panel({
  label: "AI",
  icon: AIPanelSvg,
  view: VideoGeneratorView,
})
