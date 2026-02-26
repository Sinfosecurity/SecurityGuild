#!/bin/zsh
set -euo pipefail

cd "$(dirname "$0")"

PORT="${1:-5173}"

python3 -m http.server "$PORT" >/dev/null 2>&1 &
SERVER_PID="$!"

sleep 1
open "http://localhost:$PORT"

echo "NYS Security Guard Quiz running:"
echo "  http://localhost:$PORT"
echo ""
echo "Close this window or press Enter to stop the server."
read -r _

kill "$SERVER_PID" >/dev/null 2>&1 || true
