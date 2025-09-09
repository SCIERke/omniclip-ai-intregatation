import modal
import sys
from pathlib import Path
from utils.load_lib import load_libs
from config.models import MODELS

app = modal.App("omniclip-ai-integration")

def create_modal_class(app, model_key: str, huggingface_token: str):
    model_cfg = MODELS[model_key]
    image = model_cfg["image"]

    @app.cls(image=image, secrets=[modal.Secret.from_dict({
        "HF_TOKEN": huggingface_token
    })])
    class ModalModel:
        def __init__(self):
            self.pipe = None
            self.processor = None

        @modal.enter()
        def load(self):
            mods = load_libs(model_cfg["libs"])
            PipelineClass = model_cfg["loader"](mods, model_cfg["name"])
            model_cfg["extra_setup"](PipelineClass ,mods)
            self.pipe = PipelineClass

        @modal.method()
        def inference(self, **kwargs):
            if not hasattr(self, "pipe") or self.pipe is None:
                raise RuntimeError("Model not loaded yet. Call load() first.")
            return model_cfg["inference"](self.pipe, **kwargs)

    return ModalModel