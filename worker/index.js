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
    // 检查环境变量
    if (!env.GITHUB_TOKEN) {
      console.error('Missing GITHUB_TOKEN');
      throw new Error('Configuration error: Missing GITHUB_TOKEN');
    }
    
    if (!env.GITHUB_REPOSITORY) {
      console.error('Missing GITHUB_REPOSITORY');
      throw new Error('Configuration error: Missing GITHUB_REPOSITORY');
    }

    // 解析请求体
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('JSON parse error:', e);
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { url } = body;
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 创建 GitHub Issue
    console.log('Creating GitHub Issue for:', url);
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

    if (!response.ok) {
      const error = await response.text();
      console.error('GitHub API error:', error);
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const issue = await response.json();
    console.log('Issue created:', issue.number);

    return new Response(JSON.stringify({
      task_id: issue.number,
      status: 'pending'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in /analyze:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Check worker logs for more information'
    }), {
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