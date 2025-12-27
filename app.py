from flask import Flask, send_from_directory, request, jsonify
import os
import tempfile


app = Flask(__name__, static_folder='.')

# Load Whisper model using faster-whisper (optimized for CPU/low-memory)
# compute_type="int8" reduces memory usage significantly while maintaining accuracy
print("Loading Whisper model...")
from faster_whisper import WhisperModel
model = WhisperModel("base", device="cpu", compute_type="int8")
print("Whisper model loaded!")

@app.route('/')
def index():
    """Serve the main index.html page."""
    return send_from_directory('.', 'index.html')

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    """Handle audio file uploads and transcription."""
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
        segments, info = model.transcribe(temp_path, beam_size=5)
        
        # Combine all segments into one text
        text = "".join([segment.text for segment in segments]) 
        
        # Clean up
        os.remove(temp_path)
        
        return jsonify({'text': text.strip()})

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
