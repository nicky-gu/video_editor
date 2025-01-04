// 创建一个简单的响应处理函数
async function handleRequest(request, env) {
  // 检查是否是 POST 请求到 /analyze
  if (request.method === 'POST' && new URL(request.url).pathname === '/analyze') {
    try {
      // 详细检查 token 格式
      const tokenDebugInfo = {
        exists: !!env.PAT_TOKEN,
        length: env.PAT_TOKEN?.length,
        startsWithGhp: env.PAT_TOKEN?.startsWith('ghp_'),
        format: env.PAT_TOKEN?.match(/^ghp_[a-zA-Z0-9]{36}$/) ? 'valid' : 'invalid',
        repository: env.GITHUB_REPOSITORY
      };
      console.log('Token debug info:', tokenDebugInfo);

      if (!env.PAT_TOKEN || !env.GITHUB_REPOSITORY) {
        throw new Error(`Missing or invalid environment variables: ${JSON.stringify(tokenDebugInfo)}`);
      }

      const { url } = await request.json();
      if (!url) {
        throw new Error('URL is required');
      }

      // 测试 GitHub API 连接
      const testResponse = await fetch('https://api.github.com/rate_limit', {
        headers: {
          'Authorization': `Bearer ${env.PAT_TOKEN.trim()}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Video-Analyzer-Worker'
        }
      });
      
      if (!testResponse.ok) {
        const testError = await testResponse.text();
        throw new Error(`GitHub API test failed: ${testResponse.status} - ${testError}`);
      }

      // 主要 API 请求
      const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.PAT_TOKEN.trim()}`,
          'X-GitHub-Api-Version': '2022-11-28',
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

      if (!response.ok) {
        const errorData = await response.text();
        console.error('GitHub API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers),
          body: errorData
        });
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
        timestamp: new Date().toISOString(),
        debug: {
          tokenExists: !!env.PAT_TOKEN,
          tokenLength: env.PAT_TOKEN?.length,
          repository: env.GITHUB_REPOSITORY
        }
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