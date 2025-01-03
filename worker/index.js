import { Router } from 'itty-router';

const router = Router();

// 添加健康检查路由
router.get('/', async () => {
  return new Response('API is running', {
    headers: { 'Content-Type': 'text/plain' }
  });
});

// 创建分析任务
router.post('/analyze', async (request, env) => {
  try {
    if (!env.GITHUB_TOKEN || !env.GITHUB_REPOSITORY) {
      throw new Error('Missing required environment variables');
    }

    const { url } = await request.json();
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// 处理所有未匹配的路由
router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  fetch: router.handle
}; 