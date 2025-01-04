// 创建一个简单的响应处理函数
const handleRequest = async (request, env) => {
  if (request.method === 'POST' && new URL(request.url).pathname === '/analyze') {
    try {
      if (!env.GITHUB_TOKEN || !env.GITHUB_REPOSITORY) {
        return new Response(JSON.stringify({ 
          error: 'Missing required environment variables' 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const { url } = await request.json();
      if (!url) {
        return new Response(JSON.stringify({ 
          error: 'URL is required' 
        }), {
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
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 处理其他所有请求
  return new Response('Not Found', { status: 404 });
};

// 导出处理器
export default {
  fetch: handleRequest
}; 