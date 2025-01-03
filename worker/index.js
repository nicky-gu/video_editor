import { Router } from 'itty-router';

const router = Router();

// 创建分析任务
router.post('/analyze', async (request, env) => {
  try {
    const { url } = await request.json();
    
    const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        title: `视频分析任务: ${url}`,
        body: JSON.stringify({
          video_url: url,
          status: 'pending',
          created_at: new Date().toISOString()
        }),
        labels: ['video-analysis', 'pending']
      })
    });

    const issue = await response.json();
    return new Response(JSON.stringify({
      task_id: issue.number,
      status: 'pending'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// 获取任务状态（直接从 GitHub Issue 获取）
router.get('/status/:taskId', async (request, env) => {
  try {
    const { taskId } = request.params;
    const response = await fetch(
      `https://api.github.com/repos/${env.GITHUB_REPOSITORY}/issues/${taskId}`,
      {
        headers: {
          'Authorization': `token ${env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      }
    );

    const issue = await response.json();
    const data = JSON.parse(issue.body);
    
    return new Response(JSON.stringify({
      task_id: taskId,
      status: data.status,
      result: data.result
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Task not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

export default {
  fetch: router.handle
}; 