import subprocess

class AudioExtractor:
    async def extract_audio(self, video_path: str) -> str:
        """提取音频"""
        audio_path = f"{video_path}.mp3"
        cmd = [
            "ffmpeg", "-i", video_path,
            "-vn",  # 不要视频
            "-acodec", "libmp3lame",
            "-ar", "16000",  # 采样率
            "-ac", "1",      # 单声道
            audio_path
        ]
        subprocess.run(cmd, check=True)
        return audio_path 