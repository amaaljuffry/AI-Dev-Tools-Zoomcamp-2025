# ============================================
# Snake Arena Online - Combined Production Build
# Frontend (React) + Backend (FastAPI) in one container
# ============================================

# Stage 1: Build Frontend (React)
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy frontend source
COPY frontend/ ./

# Build production bundle
RUN npm run build


# Stage 2: Build Backend (Python with uv)
FROM python:3.12-slim AS backend-builder

WORKDIR /backend

# Install uv for fast dependency management
RUN pip install uv

# Copy dependency files
COPY backend/pyproject.toml backend/requirements.txt ./

# Create virtual environment and install dependencies
RUN uv venv /opt/venv && \
    . /opt/venv/bin/activate && \
    uv pip install -r requirements.txt


# Stage 3: Production Runtime
FROM python:3.12-slim AS production

# Install nginx and supervisor
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && rm /etc/nginx/sites-enabled/default

# Copy Python virtual environment from builder
COPY --from=backend-builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy frontend build to nginx serve directory
COPY --from=frontend-builder /frontend/build /usr/share/nginx/html

# Copy backend application
WORKDIR /app
COPY backend/app ./app
COPY backend/run.py ./

# Copy nginx configuration
COPY nginx.prod.conf /etc/nginx/conf.d/default.conf

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=80

# Expose port 80 (nginx handles all traffic)
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start supervisor (manages nginx + uvicorn)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
