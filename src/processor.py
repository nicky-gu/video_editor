from typing import Dict
import asyncio
import zhipuai
import os
from src.audio_extractor import AudioExtractor
from src.transcriber import Transcriber
import aiohttp

class ProcessingError(Exception):
    """视频处理错误"""
    pass

class VideoProcessor:
    def __init__(self):
        self.audio_extractor = AudioExtractor()
        self.transcriber = Transcriber()
        self.zhipu_client = zhipuai.ZhipuAI(api_key=os.environ['ZHIPUAI_API_KEY'])
        
    async def download_video(self, video_url: str) -> str:
        """下载视频文件"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(video_url) as response:
                    if response.status != 200:
                        raise ProcessingError(f"下载视频失败: HTTP {response.status}")
                    
                    # 创建临时文件
                    video_path = "temp_video.mp4"
                    with open(video_path, "wb") as f:
                        while True:
                            chunk = await response.content.read(8192)
                            if not chunk:
                                break
                            f.write(chunk)
                    
                    return video_path
        except Exception as e:
            raise ProcessingError(f"下载视频失败: {str(e)}")
    
    async def process_video(self, video_url: str) -> dict:
        try:
            # 下载视频
            video_path = await self.download_video(video_url)
            
            # 提取音频
            audio_path = await self.audio_extractor.extract_audio(video_path)
            
            # 转录音频
            transcription = await self.transcriber.transcribe(audio_path)
            
            # 清理临时文件
            self.cleanup_files([video_path, audio_path])
            
            return {
                "success": True,
                "transcription": transcription
            }
            
        except Exception as e:
            raise ProcessingError(f"处理失败: {str(e)}")
            
    def cleanup_files(self, files: list):
        """清理临时文件"""
        for file in files:
            try:
                if os.path.exists(file):
                    os.remove(file)
            except Exception as e:
                print(f"清理文件失败 {file}: {str(e)}") 