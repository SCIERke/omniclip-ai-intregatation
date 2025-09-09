#!/bin/bash
# Usage: ./set_modal_tokens.sh <modal_token_id> <modal_token_secret> <hf_token>

MODAL_TOKEN_ID=$1
MODAL_TOKEN_SECRET=$2
HF_TOKEN=$3

if [ -z "$MODAL_TOKEN_ID" ] || [ -z "$MODAL_TOKEN_SECRET" ] || [ -z "$HF_TOKEN" ]; then
    echo "Usage: $0 <modal_token_id> <modal_token_secret> <hf_token>"
    exit 1
fi

PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || realpath "$(dirname "$0")/..")

mkdir -p "$PROJECT_ROOT/server/config"

cat <<EOF > "$PROJECT_ROOT/server/config/.env"
MODAL_TOKEN_ID=$MODAL_TOKEN_ID
MODAL_TOKEN_SECRET=$MODAL_TOKEN_SECRET
HF_TOKEN=$HF_TOKEN
EOF

echo "✅ Modal tokens saved to $PROJECT_ROOT/server/config/.env"