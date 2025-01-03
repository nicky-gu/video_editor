import os
import json
import requests
from processor import VideoProcessor
import logging
from asyncio import timeout

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QueueProcessor:
    def __init__(self):
        self.api_token = os.environ['CLOUDFLARE_API_TOKEN']
        self.account_id = os.environ['CLOUDFLARE_ACCOUNT_ID']
        self.queue_name = 'video-tasks'
        self.processor = VideoProcessor()

    async def get_tasks(self):
        """从 Cloudflare Queue 获取任务"""
        response = requests.post(
            f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}/queues/{self.queue_name}/get",
            headers={
                "Authorization": f"Bearer {self.api_token}",
                "Content-Type": "application/json"
            },
            json={"batch_size": 1}  # 每次处理一个任务
        )
        return response.json()['result']['messages']

    async def update_task_status(self, task_id, status, result=None, error=None):
        """更新任务状态到 KV 存储"""
        data = {
            "status": status,
            "updated_at": datetime.utcnow().isoformat()
        }
        if result:
            data["result"] = result
        if error:
            data["error"] = error

        response = requests.put(
            f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}/storage/kv/namespaces/{KV_NAMESPACE_ID}/values/{task_id}",
            headers={"Authorization": f"Bearer {self.api_token}"},
            json=data
        )
        return response.ok

    async def process_tasks(self):
        """处理队列中的任务"""
        logger.info("开始处理队列任务")
        async with timeout(3600):  # 1小时超时
            try:
                await self.process_single_task()
            except TimeoutError:
                logger.error("任务处理超时")

    async def process_single_task(self):
        tasks = await self.get_tasks()
        
        for task in tasks:
            task_data = json.loads(task['body'])
            task_id = task_data['taskId']
            
            try:
                # 更新状态为处理中
                await self.update_task_status(task_id, "processing")
                
                # 处理视频
                result = await self.processor.process_video(task_data['url'])
                
                # 更新状态为完成
                await self.update_task_status(task_id, "completed", result=result)
                
                # 处理完成后需要从队列中删除消息
                await self.delete_message(task['id'])
            except Exception as e:
                # 更新状态为失败
                await self.update_task_status(task_id, "failed", error=str(e))

if __name__ == "__main__":
    import asyncio
    
    processor = QueueProcessor()
    asyncio.run(processor.process_tasks()) 