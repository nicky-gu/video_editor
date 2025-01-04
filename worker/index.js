import { Router } from 'itty-router';

const router = Router();

// 添加健康检查路由
router.get('/', () => {
  return Promise.resolve(new Response('API is running', {
    headers: { 'Content-Type': 'text/plain' }
  }));
});

// 处理 favicon.ico 请求
router.get('/favicon.ico', () => {
  return Promise.resolve(new Response(null, {
    status: 204
  }));
});

// 处理对 /analyze 的 GET 请求
router.get('/analyze', () => {
  return Promise.resolve(new Response(JSON.stringify({
    error: 'Method not allowed. Please use POST request.'
  }), {
    status: 405,
    headers: { 
      'Content-Type': 'application/json',
      'Allow': 'POST'
    }
  }));
});

// 创建分析任务 - POST 请求
router.post('/analyze', async (request, env) => {
  return Promise.resolve().then(async () => {
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
          'Content-Type': 'application/json',
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
});

// 处理所有未匹配的路由
router.all('*', () => {
  return Promise.resolve(new Response('Not Found', { status: 404 }));
});

export default {
  fetch: (request, env, ctx) => {
    return Promise.resolve(router.handle(request, env, ctx));
  }
}; 