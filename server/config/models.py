import modal

MODELS = {
    "ostris/qwen_image_edit_inpainting": {
        "name": "ostris/qwen_image_edit_inpainting",
        "type": "image",  # image pipeline
        "image": modal.Image.debian_slim().pip_install(
            "torch", "Pillow", "git+https://github.com/huggingface/diffusers"
        ),
        "libs": ["torch", "diffusers", "PIL"],
        "loader": lambda mods, model_name: mods["diffusers"].QwenImageEditPipeline.from_pretrained(model_name),
        "inference": lambda pipe, **kwargs: pipe(**kwargs).images[0],
        "extra_setup": lambda pipe, mods: pipe.to("cuda").to(mods["torch"].bfloat16)
    },
    "zai-org/CogVideoX1.5-5B": {
        "name": "zai-org/CogVideoX1.5-5B",
        "type": "video",  # video pipeline
        "image": modal.Image.debian_slim().pip_install(
            "torch",
            "git+https://github.com/huggingface/diffusers",
            "transformers>=4.46.2",
            "accelerate>=1.1.1",
            "imageio-ffmpeg>=0.5.1",
        ),
        "libs": ["torch", "diffusers"],
        "loader": lambda mods, model_name: mods["diffusers"].CogVideoXPipeline.from_pretrained(
            model_name, torch_dtype=mods["torch"].bfloat16
        ),
        "inference": lambda pipe, **kwargs: pipe(**kwargs).frames[0],
        "extra_setup": lambda pipe: (
            pipe.enable_sequential_cpu_offload(),
            pipe.vae.enable_tiling(),
            pipe.vae.enable_slicing(),
        ),
    },
}
