import modal
import os
from config.models import MODELS
from dotenv import load_dotenv
from pathlib import Path
import regex as re
from utils.sandbox.find_sandboxes import find_sandbox
from utils.safe_name_handler import safe_name

load_dotenv(Path("config") / ".env")

app = modal.App.lookup("omniclip-test", create_if_missing=True)

base_image = (
    modal.Image.debian_slim()
    .pip_install("fastapi[standard]", "pillow", "modal")
    .env({"HF_HOME": "/cache/huggingface"})

)

async def create_model_sandbox(model_key: str):
    model_image = base_image.pip_install(*MODELS[model_key].get("sources", []))
    module_image = (
        model_image
        .add_local_python_source("config")
        .add_local_python_source("services")
        .add_local_python_source("utils")
        .add_local_python_source("server_commands")
    )
    volume = modal.Volume.from_name("omniclip-test-volume", create_if_missing=True)
    secret = modal.Secret.from_dict({"HF_TOKEN": os.environ["HF_TOKEN"] ,"MODEL_KEY": model_key})

    sb = modal.Sandbox.create(
        app=app,
        name=safe_name(model_key),
        image=module_image,
        volumes={"/cache": volume},
        secrets=[secret],
        timeout=3600,
    )

    print(f"Created sandbox id={sb.object_id} for model={model_key}")

    return sb
