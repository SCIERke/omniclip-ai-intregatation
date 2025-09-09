import sys
import modal
from config.models import MODELS
from utils.load_lib import load_libs

# Modal App
app = modal.App("omniclip-model-server")

@app.cls()
class ModalModel:
    model_key: str = modal.parameter()
    hf_token: str = modal.parameter()

    pipe = None
    mods = None

    @modal.enter()
    def load(self):
        """โหลดโมเดลเข้ามาใน container"""
        model_cfg = MODELS.get(self.model_key)
        if not model_cfg:
            raise ValueError(f"❌ Model {self.model_key} not found in MODELS")

        print(f"✅ Loading model: {self.model_key}")

        # โหลด dependencies
        self.mods = load_libs(model_cfg["libs"])

        # โหลด pipeline
        PipelineClass = model_cfg["loader"](self.mods, model_cfg["name"])

        # extra setup (device, precision, etc.)
        if "extra_setup" in model_cfg:
            if "mods" in model_cfg["extra_setup"].__code__.co_varnames:
                model_cfg["extra_setup"](PipelineClass, self.mods)
            else:
                model_cfg["extra_setup"](PipelineClass)

        self.pipe = PipelineClass
        return f"Model {self.model_key} initialized on Modal"

    @modal.method()
    def inference(self, **kwargs):
        """รัน inference"""
        if self.pipe is None:
            raise RuntimeError("⚠️ Model not loaded yet. Call load() first.")

        model_cfg = MODELS[self.model_key]
        print(f"🚀 Running inference on {self.model_key} with args: {kwargs.keys()}")

        result = model_cfg["inference"](self.pipe, **kwargs)
        return result


# Entry point
if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 init.py <model_key> <hf_token>")
        sys.exit(1)

    model_key = sys.argv[1]
    hf_token = sys.argv[2]

    with app.run():
        modal_instance = ModalModel(model_key=model_key, hf_token=hf_token)
        modal_instance.load.remote().get()

        # # 🧪 ตัวอย่างการ inference
        # if model_key == "ostris/qwen_image_edit_inpainting":
        #     result = modal_instance.inference.remote(
        #         image="tests/cat.png",
        #         prompt="make it look like a Van Gogh painting",
        #         generator=modal_instance.pipe.device.manual_seed(0),
        #         true_cfg_scale=4.0,
        #         negative_prompt=" ",
        #         num_inference_steps=20,
        #     ).get()
        #     result.save("output_image.png")
        #     print("✅ Image saved: output_image.png")

        # elif model_key == "zai-org/CogVideoX1.5-5B":
        #     result = modal_instance.inference.remote(
        #         prompt="A cat playing piano in space",
        #         num_videos_per_prompt=1,
        #         num_inference_steps=20,
        #         num_frames=16,
        #         guidance_scale=6,
        #     ).get()

        #     from diffusers.utils import export_to_video
        #     export_to_video(result, "output_video.mp4", fps=8)
        #     print("✅ Video saved: output_video.mp4")

        # else:
        #     print("⚠️ No test inference defined for this model.")
