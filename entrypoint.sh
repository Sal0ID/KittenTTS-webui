#!/bin/sh
set -e

# Start the Python backend in the background
cd /app/python_backend
UV_SKIP_WHEEL_FILENAME_CHECK=1 uv run python main.py &

# Start the NextJS production server in the foreground
cd /app/nextjs_website
node server.js
