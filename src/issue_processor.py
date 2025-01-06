import os
import json
from github import Github
from src.processor import VideoProcessor
from src.audio_extractor import AudioExtractor
from src.transcriber import Transcriber
from src.queue_processor import QueueProcessor

class IssueProcessor:
    def __init__(self):
        self.github = Github(os.environ['GITHUB_TOKEN'])
        self.repo = self.github.get_repo(os.environ['GITHUB_REPOSITORY'])
        self.processor = VideoProcessor()

    async def process_issue(self, issue_number: int):
        """处理单个 Issue"""
        try:
            issue = self.repo.get_issue(issue_number)
            data = json.loads(issue.body)
            
            # 处理视频
            result = await self.processor.process_video(data['video_url'])
            
            # 更新 Issue
            data.update({
                'status': 'completed',
                'result': result
            })
            
            issue.edit(
                body=json.dumps(data, ensure_ascii=False, indent=2),
                labels=['video-analysis', 'completed']
            )

        except Exception as e:
            # 更新失败状态
            data = json.loads(issue.body)
            data['status'] = 'failed'
            data['error'] = str(e)
            
            issue.edit(
                body=json.dumps(data, ensure_ascii=False, indent=2),
                labels=['video-analysis', 'failed']
            ) 