// 创建一个简单的响应处理函数
async function handleRequest(request, env) {
  // 检查是否是 POST 请求到 /analyze
  if (request.method === 'POST' && new URL(request.url).pathname === '/analyze') {
    try {
      // 检查环境变量并打印状态
      console.log('Environment check:', {
        hasPAT: !!env.PAT_TOKEN,
        patTokenLength: env.PAT_TOKEN?.length,
        repository: env.GITHUB_REPOSITORY
      });

      if (!env.PAT_TOKEN || !env.GITHUB_REPOSITORY) {
        throw new Error('Missing required environment variables');
      }

      const { url } = await request.json();
      if (!url) {
        throw new Error('URL is required');
      }

      // 打印请求信息（注意不要打印完整的 token）
      console.log('Making GitHub API request:', {
        url: `https://api.github.com/repos/${env.GITHUB_REPOSITORY}/issues`,
        tokenPrefix: env.PAT_TOKEN.substring(0, 4) + '...',
        repository: env.GITHUB_REPOSITORY
      });

      const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${env.PAT_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Video-Analyzer-Worker'
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

      // 详细的错误处理
      if (!response.ok) {
        const errorData = await response.text();
        const errorInfo = {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers),
          body: errorData
        };
        console.error('GitHub API Error Details:', errorInfo);
        throw new Error(`GitHub API error: ${response.status} - ${errorData}`);
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
      console.error('Full Error:', {
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      return new Response(JSON.stringify({ 
        error: error.message,
        details: error.stack,
        timestamp: new Date().toISOString()
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