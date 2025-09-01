import modal
from pathlib import Path
import subprocess

app = modal.App("omniclip-ai-service")

image = (
    modal.Image.from_registry("nvidia/cuda:12.8.0-devel-ubuntu22.04", add_python="3.12")
    .apt_install("git")
    .pip_install("packaging", "setuptools", "wheel", "python-dotenv", "huggingface_hub", "torch==2.7.1")
    .run_commands("git clone https://github.com/ModelTC/Wan2.2-Lightning.git")
    .run_commands("pip install -r /Wan2.2-Lightning/requirements.txt")
    # .pip_install("flashinfer-python==0.2.8")
    .env({"HF_HOME": "/root/.cache/huggingface"})
)

secrets = [modal.Secret.from_name("huggingface-token")]

hf_cache_volume = modal.Volume.from_name("hf-cache", create_if_missing=True)
hf_cache_path = Path("/root/.cache/huggingface")

output_volume = modal.Volume.from_name("outputs" ,create_if_missing=True)
output_path = Path("/outputs")

MINUTE = 60


@app.cls(
    image=image,
    secrets=secrets,
    gpu="A10G",   # pick a GPU you actually have access to
    scaledown_window=4*MINUTE,
    timeout=1200,
    volumes={hf_cache_path:hf_cache_volume , output_path:output_volume},
)
class WanModel:
    @modal.enter()
    def load(self):
        import os
        from huggingface_hub import snapshot_download

        self.hf_token = os.getenv("HF_TOKEN")

        print("Loading model with token:", self.hf_token[:4] + "***********")

        # Download base model
        self.model_dir = snapshot_download(
            repo_id="Wan-AI/Wan2.2-T2V-A14B",
            token=self.hf_token,
            cache_dir=str(hf_cache_path),
        )

        # Download Lightning LoRA
        self.lora_dir = snapshot_download(
            repo_id="lightx2v/Wan2.2-Lightning",
            token=self.hf_token,
            cache_dir=str(hf_cache_path),
        )

        print("✅ Models downloaded:")
        print("Base:", self.model_dir)
        print("LoRA:", self.lora_dir)

    @modal.method()
    def generate(self, prompt: str):
        output_file = "output.mp4"
        cmd = [
            "python", "/Wan2.2-Lightning/generate.py",
            "--task", "t2v-A14B",
            "--size", "1280*720",
            "--ckpt_dir", self.model_dir,
            "--lora_dir", self.lora_dir,
            "--offload_model", "True",
            "--base_seed", "42",
            "--prompt", prompt,
            "--output" ,f"{output_path}/{output_file}"
        ]
        subprocess.run(cmd, check=True)


# This is Example Usage

# @app.local_entrypoint()
# def main(prompt: str):
#     model = WanModel()
#     job = model.generate.remote(prompt)
#     job.result()
