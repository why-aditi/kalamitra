FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY req.txt .
RUN pip install --no-cache-dir -r req.txt

# Copy all app files
COPY . .

# Set environment variables (or pass through at runtime via Render)
ENV PYTHONUNBUFFERED=1

# Make sure .env is copied (or loaded on Render)
COPY .env .env

# Expose FastAPI port
EXPOSE 8000

# Run seeding script then start FastAPI app
CMD ["sh", "-c", "python scripts/seed_orders.py && uvicorn main:app --host 0.0.0.0 --port 8000"]
