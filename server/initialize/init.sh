#!/bin/bash
# Load tokens from .modal_env

PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || realpath "$(dirname "$0")/..")

if [ -f $PROJECT_ROOT/server/config/.env ]; then
    export $(cat $PROJECT_ROOT/server/config/.env | xargs)
else
    echo "⚠️ $PROJECT_ROOT/server/config/.env not found. Please run set_modal_tokens.sh first."
    exit 1
fi

MODEL_KEY=$1
if [ -z "$MODEL_KEY" ]; then
    echo "Usage: $0 <model_key>"
    exit 1
fi

echo "Starting Modal server with model: $MODEL_KEY"
PYTHONPATH=$PROJECT_ROOT/server python3 $PROJECT_ROOT/server/initialize/init.py "$MODEL_KEY" "$HF_TOKEN"
