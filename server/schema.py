from pydantic import BaseModel
from typing import Optional
from fastapi import UploadFile, File


class Tokens(BaseModel):
  modal_token_id: str
  modal_token_secret: str
  huggingface: str

# class ImagePayload(BaseModel):
#   name: str
#   image: Optional[UploadFile] = File(None)
#   hash: str


# class GeneratePayload(BaseModel):
#   tokens: Tokens
#   prompt: Optional[str] = None
#   image: Optional[ImagePayload] = None
#   model: str