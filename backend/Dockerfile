# ─────────────────────────────────────────────────────────
# Backend Dockerfile — Django + Gunicorn (Production)
# ─────────────────────────────────────────────────────────
FROM python:3.13-slim

WORKDIR /app

# Prevent .pyc files and buffered stdout
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies for psycopg2 + Pillow
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn

# Copy project files
COPY . .

EXPOSE 8000

# Start Django with Gunicorn (3 workers for production)
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
