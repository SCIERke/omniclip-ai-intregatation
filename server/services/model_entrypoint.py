from config.models import MODELS
from PIL import Image
import importlib

def load_libs(libs):
    modules = {}
    for lib in libs:
        modules[lib] = importlib.import_module(lib)
    return modules


def load_model(model_key):
    cfg = MODELS[model_key]
    mods = load_libs(cfg.get("libs", []))
    pipe = cfg["loader"](mods, cfg["name"])
    if "extra_setup" in cfg:
        cfg["extra_setup"](pipe, mods)
    return pipe

def inference(model_key , **inputs):
    pipe = load_model(model_key)
    cfg = MODELS[model_key]

    model_inputs = {}
    for key in cfg.get("required_inputs", []):
      if key in inputs and inputs[key] is not None:
        if key == "input_path":  # convert input_path to PIL image
            try:
                model_inputs["image"] = Image.open(inputs[key])
            except Exception as e:
                raise ValueError(f"Cannot open image from path {inputs[key]}: {e}")
        else:
            model_inputs[key] = inputs[key]

    # fix how to dynamic here (and in MODELS)
    return cfg["inference"](pipe, model_inputs)