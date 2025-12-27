# %%
import whisper
import os

print("Script has started")

# Load the model (small, medium, large - tradeoff speed vs accuracy)
model = whisper.load_model("base")

print("Model has been loaded")

file_list = [
    # Upload files here
]

# Transcribe audio
for file_path in file_list:
    print(f"Transcribing: {file_path}...")
    result = model.transcribe(file_path)
    transcription_text = result["text"]

    # Create a unique text file for each transcription
    base_name = os.path.splitext(os.path.basename(file_path))[0]
    output_file = f"{base_name}_transcription.txt"

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(transcription_text)

    print(f"✅ Transcription saved to {output_file}\n")



