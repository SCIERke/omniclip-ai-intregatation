import modal
from utils.safe_name_handler import safe_name

def find_sandbox(name: str):
  try:
    sb = modal.Sandbox.from_name("omniclip-test", safe_name(name))
    return sb
  except modal.exception.NotFoundError:
      return None