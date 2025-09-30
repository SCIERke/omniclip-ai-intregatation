from services.model_entrypoint import inference
import argparse
import sys
import modal
import os

if __name__ == "__main__":
  # Usage: python3 -m server_commands.inference (in server root)
  print("✅ Starting Inference", flush=True)
  print("⚠️ Error log test", file=sys.stderr, flush=True)

  parser = argparse.ArgumentParser(description="A script that inference")

  parser.add_argument("--model" ,type=str)
  parser.add_argument("-p" ,"--prompt" ,type=str)
  parser.add_argument("-i" ,"--input-path" ,type=str)

  args = parser.parse_args()

  if not args.model:
    print("⚠️ Warning: Please provide model by using --model < your_model_name >")
    sys.exit(0)


  inputs = {}

  if args.prompt:
    inputs["prompt"] = str(args.prompt)

  if args.input_path:
    inputs["input_path"] = str(args.input_path)

  print(f"Inference with {inputs} by using model {args.model}")

  result = inference(str(args.model) ,**inputs)
  print(f"Result from inference: {result}")
  if result:
    try:
      output_dir = "/cache/images"
      os.makedirs(output_dir, exist_ok=True)

      output_path = os.path.join(output_dir, "output.png")
      result.save(output_path)
      print(f"Image saved into volume at {output_path}")
    except Exception as e:
      print(f"‼️ Save failed — output may not be a valid image or video. Error: {e}")
