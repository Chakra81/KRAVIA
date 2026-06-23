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

# Copy and use startup script (runs migrations + creates admin user + starts gunicorn)
COPY start.sh .
RUN chmod +x start.sh

CMD ["./start.sh"]
