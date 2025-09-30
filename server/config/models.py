
MODELS = {
    "ostris/qwen_image_edit_inpainting": {
        # "name": "ostris/qwen_image_edit_inpainting",
        # "type": "image",  # image pipeline
        # "image": ["torch", "Pillow", "git+https://github.com/huggingface/diffusers"],
        # "libs": ["torch", "diffusers", "PIL"],
        # "loader": lambda mods, model_name: mods["diffusers"].QwenImageEditPipeline.from_pretrained(model_name),
        # "inference": lambda pipe, inputs: pipe(**inputs).images[0],
        # "extra_setup": lambda pipe, mods: (
        #     pipe.load_lora_weights("ostris/qwen_image_edit_inpainting"),
        #     pipe.to("cuda")
        # )
    },
    "OFA-Sys/small-stable-diffusion-v0": {
        "name": "OFA-Sys/small-stable-diffusion-v0",
        "type": "image",
        "sources": ["torch" ,"diffusers" , "Pillow","peft==0.17.1"],
        "libs": ["torch", "diffusers", "PIL"],
        "loader": lambda mods, model_name: mods["diffusers"].DiffusionPipeline.from_pretrained(model_name,  cache_dir="/cache/huggingface") ,
        "required_inputs": ["prompt"],
        "inference": lambda pipe, inputs: pipe(inputs["prompt"]).images[0],
        "extra_setup": lambda pipe, mods: (
            # pipe.to("cuda")
        )
    },
    "zai-org/CogVideoX1.5-5B": {
        # video
    },
}
