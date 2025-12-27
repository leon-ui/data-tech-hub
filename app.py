from flask import Flask, send_from_directory, request, jsonify
import os
import tempfile


app = Flask(__name__, static_folder='.')

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
        
        # Transcribe using faster-whisper
        # segments is a generator, so we iterate to get result
        segments, info = model.transcribe(temp_path, beam_size=1)
        
        from flask import Response, stream_with_context

        def generate():
            try:
                for segment in segments:
                    yield segment.text
                # Cleanup after generation is done
                os.remove(temp_path)
            except Exception as e:
                print(f"Streaming error: {e}")
                # We can't really change the status code now, but we can log it
                # or yield an error marker if we defined a protocol.
                # For now, just stop.
                try: 
                    os.remove(temp_path)
                except: 
                    pass
        
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
