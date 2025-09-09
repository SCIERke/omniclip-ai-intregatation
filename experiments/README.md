to run this first create .env and fill you huggingface key
HF_TOKEN=hf_xxxxx

and then run this to create your modal secrets

python -m modal secret create huggingface-token --from-dotenv experiments/.env

deploy that modal

use it via localentrypoint