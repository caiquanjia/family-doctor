// Netlify Function: DeepSeek API 代理
// 支持 /api/deepseek/chat → https://api.deepseek.com/chat/completions
// API Key 从环境变量 DEEPSEEK_API_KEY 注入，前端不暴露

export default async (request, context) => {
  // 只允许 POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: 'DeepSeek API key not configured on server',
        error_type: 'NO_API_KEY'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 读取前端发来的请求体
    const body = await request.text();
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 转发到 DeepSeek API
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify(parsed)
    });

    // 检查 DeepSeek 返回的错误
    if (!res.ok) {
      const errText = await res.text();
      return new Response(errText, {
        status: res.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 透传流式响应（SSE）或普通 JSON 响应
    const contentType = res.headers.get('Content-Type') || 'text/event-stream';
    return new Response(res.body, {
      status: res.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
