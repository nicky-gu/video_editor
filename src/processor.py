from typing import Dict
import asyncio
import zhipuai
import os
from src.audio_extractor import AudioExtractor
from src.transcriber import Transcriber

class VideoProcessor:
    def __init__(self):
        self.audio_extractor = AudioExtractor()
        self.transcriber = Transcriber()
        self.zhipu_client = zhipuai.ZhipuAI(api_key=os.environ['ZHIPUAI_API_KEY'])
        
    async def analyze_transcript(self, transcript: list) -> Dict:
        """使用智谱AI分析转录内容"""
        # 将转录内容格式化为易读的文本
        formatted_text = "\n".join([
            f"[{segment['start']}-{segment['end']}] {segment['text']}"
            for segment in transcript
        ])
        
        # 构建提示词
        prompt = f"""请分析以下视频转录内容，给出：
1. 关键时间点及其重要内容
2. 适合剪辑的片段建议
3. 内容摘要

转录内容：
{formatted_text}"""

        # 调用智谱AI进行分析
        response = self.zhipu_client.chat.completions.create(
            model="glm-4",  # 或其他适合的模型
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )
        
        return {
            'transcript': transcript,
            'analysis': response.choices[0].message.content,
            'video_url': video_url
        }
        
    async def process_video(self, video_url: str) -> Dict:
        """处理视频并返回分析结果"""
        try:
            # 1. 下载视频
            video_path = await self.download_video(video_url)
            
            # 2. 提取音频
            audio_path = await self.audio_extractor.extract_audio(video_path)
            
            # 3. 转录音频
            transcription = await self.transcriber.transcribe(audio_path)
            
            # 4. 使用智谱AI分析转录内容
            result = await self.analyze_transcript(transcription)
            
            # 5. 清理临时文件
            self.cleanup_files([video_path, audio_path])
            
            return result
                
        except Exception as e:
            raise ProcessingError(f"处理失败: {str(e)}") 