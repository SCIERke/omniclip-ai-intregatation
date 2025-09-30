from fastapi import FastAPI, UploadFile ,HTTPException ,status, File, Form
from fastapi.responses import StreamingResponse
from typing import Optional
import modal
from utils.sandbox.create_sandboxes import create_model_sandbox
from utils.sandbox.find_sandboxes import find_sandbox
from utils.safe_name_handler import safe_name
from io import BytesIO
import tempfile
from config.models import MODELS
from PIL import Image
import os

app = FastAPI()

@app.get("/")
async def get_health():
  return {"status" : "server ok!"}

@app.post("/inference/modal")
async def run_inference(
  model_key: str = Form(...),
  image: Optional[UploadFile] = File(None),
  prompt: Optional[str] = Form(None),
):
  vol = modal.Volume.from_name("omniclip-test-volume", create_if_missing=True)

  if not(model_key in MODELS):
    raise HTTPException(
      status_code=400,
      detail=f"Invalid model_key: {model_key}. Must be one of {list(MODELS.keys())}"
    )


  inputs = {}
  if prompt:
    inputs["prompt"] = prompt

  if image:
    # Check file type
    allowed_mimetypes = ["image/jpeg", "image/png"]
    if image.content_type not in allowed_mimetypes:
      raise HTTPException(
        status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        detail=f"Unsupported file type: {image.content_type}. Allowed types are: {', '.join(allowed_mimetypes)}"
      )

    try:
      with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(await image.read())
        tmp_path = tmp.name

      with vol.batch_upload() as batch:
        batch.put_file(tmp_path, "/cache/images/" + image.filename)
      inputs["input_path"] = "/cache/images/" + image.filename
    except Exception as e:
      raise HTTPException(status_code=500, detail=f"Failed to upload image: {e}")
    finally:
      # Clean up the temporary file
      if os.path.exists(tmp_path):
          os.unlink(tmp_path)

  sb = find_sandbox(safe_name(model_key))
  if not sb:
      print(f"No sandbox found. Creating new one for {model_key}...")
      sb = await create_model_sandbox(model_key)
      print("Create Successfully")

  args = ["python", "-m", "server_commands.inference", "--model", model_key]

  if "prompt" in list(inputs.keys()):
      args += ["--prompt", inputs["prompt"]]
  if "input_path" in inputs:
      args += ["--input-path", inputs["input_path"]]
  # doesn't work

  print(f"Commands: {args}")
  result = sb.exec(*args, timeout=3600)
  logs = []
  for line in result.stdout:
      print("STDOUT:", line, end="")
      logs.append(line)

  for line in result.stderr:
      print("STDERR:", line, end="")

  if result.stderr:
    raise HTTPException(status_code=500, detail="Inference Failed".join(result.stderr))

  # get file from output store in value
  output_path = "/images/output.png"
  file_bytes = b""
  for chunk in vol.read_file(output_path):
    file_bytes += chunk

  image = Image.open(BytesIO(file_bytes))
  buf = BytesIO()
  image.save(buf, format="PNG")
  buf.seek(0)

  if inputs.get("input_path"):
    vol.remove_file(inputs["input_path"])
    print(f"Deleted file {inputs['input_path']} from volume")

  vol.remove_file(output_path)
  print(f"Deleted file {output_path} from volume")

  return StreamingResponse(buf, media_type="image/png")