# ── Stage 1: Build Frontend ──────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy dependencies first for caching
COPY frontend/package*.json ./
RUN npm ci

# Copy source and build
COPY frontend/ ./
# We pass a placeholder or root relative API URL for the single-port mode
ENV VITE_API_BASE_URL=""
RUN npm run build

# ── Stage 2: Serve Backend & Frontend together ────────────────────────
FROM python:3.11-slim
WORKDIR /app

# System dependencies (for PyMuPDF / Pillow)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies and install
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./

# Copy built frontend assets to serve them from the backend
COPY --from=frontend-builder /app/frontend/dist ./static

# Expose default port (7860 is used by Hugging Face Spaces)
EXPOSE 7860
ENV PORT=7860
ENV DATABASE_URL="sqlite:///./readlingo.sqlite3"

# Run the app
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
