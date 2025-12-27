from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
import os
import tempfile
import sys

# Force stdout to be unbuffered so logs appear immediately
sys.stdout = sys.stdout

app = Flask(__name__, static_folder='.')

# Configure max upload size to 500MB
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500 MB

# Enable CORS for all routes (allows cross-origin requests)
CORS(app)

# Simple test endpoint to verify POST works
@app.route('/test-post', methods=['POST', 'GET'])
def test_post():
    print(f"TEST ENDPOINT HIT: {request.method}", flush=True)
    return jsonify({'status': 'ok', 'method': request.method})

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

# Storage for chunked uploads (in-memory for simplicity on free tier)
upload_chunks = {}

@app.route('/upload-chunk', methods=['POST'])
def upload_chunk():
    """Receive a chunk of audio data."""
    try:
        data = request.get_json()
        upload_id = data.get('uploadId')
        chunk_index = data.get('chunkIndex')
        total_chunks = data.get('totalChunks')
        chunk_data = data.get('data')
        
        if not all([upload_id, chunk_index is not None, total_chunks, chunk_data]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        print(f"Received chunk {chunk_index + 1}/{total_chunks} for upload {upload_id}", flush=True)
        
        # Initialize storage for this upload if needed
        if upload_id not in upload_chunks:
            upload_chunks[upload_id] = {'chunks': {}, 'total': total_chunks}
        
        # Store chunk
        upload_chunks[upload_id]['chunks'][chunk_index] = chunk_data
        
        # Check if all chunks received
        received = len(upload_chunks[upload_id]['chunks'])
        
        return jsonify({
            'status': 'ok',
            'received': received,
            'total': total_chunks,
            'complete': received == total_chunks
        })
        
    except Exception as e:
        print(f"Chunk upload error: {e}", flush=True)
        return jsonify({'error': str(e)}), 500

@app.route('/process-upload', methods=['POST'])
def process_upload():
    """Process a completed chunked upload."""
    import base64
    
    try:
        data = request.get_json()
        upload_id = data.get('uploadId')
        
        if upload_id not in upload_chunks:
            return jsonify({'error': 'Upload not found'}), 404
        
        upload = upload_chunks[upload_id]
        
        # Check if complete
        if len(upload['chunks']) != upload['total']:
            return jsonify({'error': f"Upload incomplete: {len(upload['chunks'])}/{upload['total']}"}), 400
        
        # Reassemble chunks
        print(f"Reassembling {upload['total']} chunks...", flush=True)
        full_base64 = ''.join([upload['chunks'][i] for i in range(upload['total'])])
        
        # Decode and save
        audio_bytes = base64.b64decode(full_base64)
        print(f"Received complete audio: {len(audio_bytes) / 1024 / 1024:.2f}MB", flush=True)
        
        fd, temp_path = tempfile.mkstemp(suffix='.wav')
        with os.fdopen(fd, 'wb') as tmp:
            tmp.write(audio_bytes)
        
        # Clean up storage
        del upload_chunks[upload_id]
        
        # Now transcribe
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        from flask import Response, stream_with_context
        import threading
        import queue

        result_queue = queue.Queue()
        
        def transcribe_worker():
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
            worker = threading.Thread(target=transcribe_worker)
            worker.start()
            
            yield "⏳ Processing...\n"
            
            while True:
                try:
                    msg_type, data = result_queue.get(timeout=5)
                    if msg_type == 'segment':
                        yield data
                    elif msg_type == 'done':
                        break
                    elif msg_type == 'error':
                        yield f"\n❌ Error: {data}"
                        break
                except queue.Empty:
                    yield " "
            
            worker.join(timeout=1)
        
        return Response(stream_with_context(generate()), mimetype='text/plain')
        
    except Exception as e:
        print(f"Process upload error: {e}", flush=True)
        return jsonify({'error': str(e)}), 500

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    """Handle audio file uploads and transcription."""
    if model is None:
        return jsonify({'error': 'Server Configuration Error: FFMPEG not found or Model failed to load.'}), 500

    import base64
    
    try:
        # Check if it's JSON (base64) or form data
        if request.is_json:
            # Base64 encoded audio
            data = request.get_json()
            if 'audio' not in data:
                return jsonify({'error': 'No audio data provided'}), 400
            
            audio_bytes = base64.b64decode(data['audio'])
            print(f"Received base64 audio: {len(audio_bytes) / 1024 / 1024:.2f}MB", flush=True)
            
            # Save to temp file
            fd, temp_path = tempfile.mkstemp(suffix='.wav')
            with os.fdopen(fd, 'wb') as tmp:
                tmp.write(audio_bytes)
        else:
            # Multipart form data (legacy)
            if 'audio' not in request.files:
                return jsonify({'error': 'No audio file provided'}), 400
            
            file = request.files['audio']
            if file.filename == '':
                return jsonify({'error': 'No selected file'}), 400
            
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
