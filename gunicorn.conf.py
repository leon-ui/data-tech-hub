# Gunicorn configuration settings
import os

# Render sets PORT variable
port = os.environ.get("PORT", "10000")
bind = f"0.0.0.0:{port}"

# Timeout in seconds (10 minutes) to allow long transcriptions
timeout = 600 

# Limit workers to 1 to stay within memory limits on free tier
workers = 1
threads = 1
worker_class = 'gthread' # threads can help with I/O bound tasks, though whisper is CPU bound.
# Actually sync worker is fine for this single-concurrency use case.
worker_class = 'sync' 
