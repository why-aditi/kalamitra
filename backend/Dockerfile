FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for image processing and other requirements
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libssl-dev \
    libffi-dev \
    libjpeg-dev \
    libpng-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (for better caching)
COPY req.txt .
RUN pip install --no-cache-dir -r req.txt

# Copy the application code.
# NOTE: there is deliberately no `COPY .env .env` here any more, and
# .dockerignore now excludes .env and firebaseservicekey.json. Both used to be
# baked into image layers, i.e. readable by anyone who could pull the image.
# Provide them at runtime instead:
#   docker run --env-file .env \
#     -v /run/secrets/firebase.json:/run/secrets/firebase.json:ro \
#     -e FIREBASE_SERVICE_ACCOUNT_PATH=/run/secrets/firebase.json ...
COPY . .

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONPATH=/app

# Run as a non-root user (this image used to run as root).
RUN useradd --create-home --uid 10001 appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4).status==200 else 1)"

# Start the application with conditional seeding
CMD ["sh", "-c", "if [ -f scripts/seed_orders.py ]; then python scripts/seed_orders.py; fi; exec uvicorn main:app --host 0.0.0.0 --port 8000"]
