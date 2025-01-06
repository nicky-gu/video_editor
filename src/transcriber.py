import whisper
from datetime import timedelta
import torch

class Transcriber:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = whisper.load_model("base").to(self.device)
        
    async def transcribe(self, audio_file):
        result = self.model.transcribe(audio_file)
        
        return [{
            "start": str(timedelta(seconds=int(segment["start"]))),
            "end": str(timedelta(seconds=int(segment["end"]))),
            "text": segment["text"].strip()
        } for segment in result["segments"]]