import whisper
from datetime import timedelta
import torch

class VideoTranscriber:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = whisper.load_model("base").to(self.device)
        
    async def transcribe(self, video_path: str):
        result = self.model.transcribe(video_path)
        
        return [{
            "start": str(timedelta(seconds=int(segment["start"]))),
            "end": str(timedelta(seconds=int(segment["end"]))),
            "text": segment["text"].strip()
        } for segment in result["segments"]] 