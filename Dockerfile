FROM python:3.9-slim

# Install system dependencies (FFMPEG is required for Whisper)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
# Install packages (including torch for whisper)
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Render sets PORT env var, but good practice to document)
EXPOSE 10000

# Run with Gunicorn using our config file (timeout, workers, etc.)
CMD ["gunicorn", "--config", "gunicorn.conf.py", "app:app"]
