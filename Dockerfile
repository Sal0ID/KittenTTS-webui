# ──────────────────────────────────────────────
# Stage 1: Build the NextJS production bundle
# ──────────────────────────────────────────────
FROM node:22-slim AS nextjs-build

WORKDIR /build

COPY nextjs_website/package.json nextjs_website/package-lock.json ./
RUN npm ci

COPY nextjs_website/ ./
RUN npm run build

# ──────────────────────────────────────────────
# Stage 2: Final runtime image
# ──────────────────────────────────────────────
FROM python:3.12-slim

# Install Node.js (needed to run the NextJS standalone server)
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl libsndfile1 && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# ── Python backend ──
WORKDIR /app/python_backend
COPY python_backend/ ./

ENV UV_SKIP_WHEEL_FILENAME_CHECK=1
# Pre-install setuptools so that source distributions (docopt via num2words)
# can build without needing to fetch it from PyPI during uv sync.
RUN pip install --no-cache-dir setuptools
RUN uv sync

# Pre-download all model weights into the HuggingFace cache so
# users never have to wait for a model download at runtime.
RUN uv run python precache_models.py

# ── NextJS standalone output ──
WORKDIR /app/nextjs_website

# The standalone server.js and its node_modules
COPY --from=nextjs-build /build/.next/standalone/ ./

# Static assets and pre-rendered pages
COPY --from=nextjs-build /build/.next/static ./.next/static
COPY --from=nextjs-build /build/public ./public

# Tell NextJS standalone which port to listen on
ENV PORT=5072
ENV HOSTNAME=0.0.0.0

# ── Entrypoint ──
WORKDIR /app
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 5072 5073

CMD ["./entrypoint.sh"]
