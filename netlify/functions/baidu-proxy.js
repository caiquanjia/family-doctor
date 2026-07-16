// Netlify Function: 百度 OCR 统一代理
// 支持 /api/baidu/token、/api/baidu/ocr/idcard、/api/baidu/ocr/accurate

export default async (request, context) => {
  try {
    const url = new URL(request.url);
    const path = url.pathname; // e.g. /api/baidu/ocr/idcard
    const isTokenPath = path.indexOf('/ocr/') === -1;

    var baiduPath = '/oauth/2.0/token';
    if (path.indexOf('/ocr/idcard') !== -1) {
      baiduPath = '/rest/2.0/ocr/v1/idcard';
    } else if (path.indexOf('/ocr/accurate') !== -1) {
      baiduPath = '/rest/2.0/ocr/v1/accurate_basic';
    }

    const baiduUrl = 'https://aip.baidubce.com' + baiduPath;
    var body = await request.text();

    // Token 端点：如果请求中没有 key，用环境变量注入
    if (isTokenPath) {
      const envApiKey = Netlify.env.get('BAIDU_API_KEY');
      const envSecretKey = Netlify.env.get('BAIDU_SECRET_KEY');

      if (!body || body.indexOf('client_id=') === -1) {
        // 前端没传 Key，用环境变量的
        if (envApiKey && envSecretKey) {
          body = 'grant_type=client_credentials'
            + '&client_id=' + encodeURIComponent(envApiKey)
            + '&client_secret=' + encodeURIComponent(envSecretKey);
        }
      }
    }

    const res = await fetch(baiduUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: body
    });

    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
