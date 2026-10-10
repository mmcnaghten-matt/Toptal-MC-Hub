#!/bin/sh
# Copies an edge function to the clipboard for pasting into the Supabase dashboard, with the current git commit stamped into
# BUILD so the report's Research log shows which build ran. The file in the repo keeps the placeholder.
#   scripts/copy-function.sh [supabase/functions/gemini-research/index.ts]
f="${1:-supabase/functions/gemini-research/index.ts}"
sha="$(git rev-parse --short HEAD)"
if ! git diff --quiet HEAD -- "$f"; then
  echo "WARNING: $f has uncommitted changes; the stamped build $sha does not match what is copied." >&2
fi
sed "s/__BUILD__/$sha/" "$f" | pbcopy
echo "Copied $f with build $sha"
