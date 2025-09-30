import regex as re

def safe_name(name: str) -> str:
  return re.sub(r"[^a-zA-Z0-9._-]", "_", name)[:63]