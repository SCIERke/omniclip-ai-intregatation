from fastapi import FastAPI,UploadFile, File , Depends
from typing import Optional
import base64
from io import BytesIO
from PIL import Image
from services.inference.modal.core import inference_modal
from schema import Tokens
import os
import modal

# fastapi_app = FastAPI()
app = modal.App("omniclip-ai-integration")


@fastapi_app.get("/")
def read_root():
  return { "Hello" : "World" }

@fastapi_app.post("/modal" ,status_code=202)
async def modal_endpoint(
  model: str,
  tokens: Tokens = Depends(),
  prompt: Optional[str] = None,
  image_name: Optional[str] = None,
  image: Optional[UploadFile] = File(None),
  image_hash: Optional[str] = None,
):
  os.environ["MODAL_TOKEN_ID"] = tokens.modal_token_id
  os.environ["MODAL_TOKEN_SECRET"] = tokens.modal_token_secret

  pil_image = None
  if image:
    image_bytes = await image.read()
    pil_image = Image.open(BytesIO(image_bytes)).convert("RGB")

  future = inference_modal(
    model=model,
    huggingface_token=tokens.huggingface,
    prompt=prompt,
    image=pil_image
  )

  return {"status": "submitted", "result": future}

@fastapi_app.post("/aws")
def inference_aws(image: Optional[UploadFile] = File(None)):
  return { "test" : "aws" }