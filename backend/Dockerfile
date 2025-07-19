FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for image processing and other requirements
RUN apt-get update && apt-get install -y \
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

# Copy the application code and environment file
COPY . .
COPY .env .env

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONPATH=/app

# Create necessary directories
RUN mkdir -p /app/utils /app/scripts /app/services /app/models /app/routes

# Ensure all Python packages are importable
RUN python -c "import sys; sys.path.append('/app'); from utils.image_helpers import construct_image_urls; print('Utils package imported successfully')"

# Expose FastAPI port
EXPOSE 8000

# Start the application with conditional seeding
CMD ["sh", "-c", "if [ -f scripts/seed_orders.py ]; then python scripts/seed_orders.py; fi && uvicorn main:app --host 0.0.0.0 --port 8000"]
