// 创建一个简单的响应处理函数
async function handleRequest(request, env) {
  // 检查是否是 POST 请求到 /analyze
  if (request.method === 'POST' && new URL(request.url).pathname === '/analyze') {
    try {
      // 检查环境变量
      if (!env.PAT_TOKEN || !env.GITHUB_REPOSITORY) {
        console.error('Missing:', { 
          hasPAT: !!env.PAT_TOKEN, 
          hasRepo: !!env.GITHUB_REPOSITORY 
        });
        throw new Error('Missing required environment variables');
      }

      // 解析请求体
      const { url } = await request.json();
      if (!url) {
        throw new Error('URL is required');
      }

      // 创建 GitHub Issue
      const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${env.PAT_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `视频分析任务: ${new URL(url).pathname.split('/').pop()}`,
          body: JSON.stringify({
            video_url: url,
            status: 'pending',
            created_at: new Date().toISOString()
          }),
          labels: ['video-analysis', 'pending']
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('GitHub API Error:', errorData);
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const issue = await response.json();
      return new Response(JSON.stringify({
        task_id: issue.number,
        status: 'pending'
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ 
        error: error.message,
        details: error.stack
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  // 处理 OPTIONS 请求（CORS 预检）
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  // 处理其他所有请求
  return new Response('Not Found', { 
    status: 404,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// 导出处理器
export default {
  fetch: handleRequest
}; 