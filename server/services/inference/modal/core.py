import modal
from utils.create_class import create_modal_class

app = modal.App("omniclip-ai-integration")

@app.function()
def inference_modal(model: str, huggingface_token: str, prompt: str ,image):
    ModalModel = create_modal_class(app, model, huggingface_token)
    model_instance = ModalModel()
    model_instance.load.remote().get()

    if model == "qwen_image_edit":
        result = model_instance.inference.remote(
            image=image,
            prompt=prompt,
            generator=model_instance.pipe.device.manual_seed(0),
            true_cfg_scale=4.0,
            negative_prompt=" ",
            num_inference_steps=50,
        ).get()
        print("✅ Image inference finished!")
        result.save("output_image_edit.png")

    elif model == "cogvideox":
        result = model_instance.inference.remote(
            prompt=prompt,
            num_videos_per_prompt=1,
            num_inference_steps=50,
            num_frames=81,
            guidance_scale=6,
            generator=model_instance.pipe.device.manual_seed(42),
        ).get()
        from diffusers.utils import export_to_video
        export_to_video(result, "output.mp4", fps=8)
        print("✅ Video inference finished!")

    else:
        raise ValueError(f"Unknown model: {model}")
