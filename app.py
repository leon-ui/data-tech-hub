from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
import os
import tempfile
import sys

# Force stdout to be unbuffered so logs appear immediately
sys.stdout = sys.stdout

app = Flask(__name__, static_folder='.')

# Enable CORS for all routes (allows cross-origin requests)
CORS(app)

# Log every request for debugging
@app.before_request
def log_request():
    print(f"INCOMING REQUEST: {request.method} {request.path}", flush=True)
    if request.content_length:
        print(f"  Content-Length: {request.content_length}", flush=True)

# Load Whisper model using faster-whisper (optimized for CPU/low-memory)
# compute_type="int8" reduces memory usage significantly while maintaining accuracy
# Check for FFMPEG
import shutil
import gc

def check_ffmpeg():
    if not shutil.which("ffmpeg"):
        print("CRITICAL: FFMPEG not found! processing will fail.")
        return False
    return True

print("Loading Whisper model...")
from faster_whisper import WhisperModel

# Ensure we have enough RAM
gc.collect()

try:
    if check_ffmpeg():
        model = WhisperModel("base", device="cpu", compute_type="int8")
        print("Whisper model loaded!")
    else:
        model = None
        print("Model loading skipped due to missing FFMPEG.")
except Exception as e:
    print(f"CRITICAL ERROR loading model: {e}")
    model = None

@app.route('/')
def index():
    """Serve the main index.html page."""
    return send_from_directory('.', 'index.html')

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    """Handle audio file uploads and transcription."""
    if model is None:
        return jsonify({'error': 'Server Configuration Error: FFMPEG not found or Model failed to load.'}), 500

    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    file = request.files['audio']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        # Save to a temporary file
        fd, temp_path = tempfile.mkstemp(suffix=os.path.splitext(file.filename)[1])
        with os.fdopen(fd, 'wb') as tmp:
            file.save(tmp)
        
        from flask import Response, stream_with_context
        import threading
        import queue
        import time

        # Queue to communicate between threads
        result_queue = queue.Queue()
        
        def transcribe_worker():
            """Background worker that transcribes and puts results in queue."""
            try:
                segments, info = model.transcribe(temp_path, beam_size=1)
                for segment in segments:
                    result_queue.put(('segment', segment.text))
                result_queue.put(('done', None))
            except Exception as e:
                result_queue.put(('error', str(e)))
            finally:
                try:
                    os.remove(temp_path)
                except:
                    pass

        def generate():
            """Generator that yields heartbeats and transcription results."""
            # Start transcription in background thread
            worker = threading.Thread(target=transcribe_worker)
            worker.start()
            
            # Send initial message
            yield "⏳ Processing...\n"
            
            while True:
                try:
                    # Wait for result with timeout (send heartbeat if nothing received)
                    msg_type, data = result_queue.get(timeout=5)
                    
                    if msg_type == 'segment':
                        yield data
                    elif msg_type == 'done':
                        break
                    elif msg_type == 'error':
                        yield f"\n❌ Error: {data}"
                        break
                except queue.Empty:
                    # No result yet, send a heartbeat to keep connection alive
                    yield " "  # Invisible heartbeat
            
            worker.join(timeout=1)
        
        return Response(stream_with_context(generate()), mimetype='text/plain')

    except Exception as e:
        print(f"Transcription error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files (CSS, JS, images, etc.)."""
    response = send_from_directory('.', filename)
    if filename.endswith('.js'):
        response.headers['Content-Type'] = 'application/javascript'
    elif filename.endswith('.css'):
        response.headers['Content-Type'] = 'text/css'
    return response

@app.after_request
def add_header(response):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response

if __name__ == '__main__':
    app.run(debug=True, port=5000)
