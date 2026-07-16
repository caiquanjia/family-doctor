// Vercel Serverless: 百度API代理共享工具
const https = require('https');

/**
 * 代理 POST 请求到百度 API
 * @param {object} req - Vercel 请求对象
 * @param {object} res - Vercel 响应对象
 * @param {string} baiduPath - 百度 API 路径
 */
function proxyToBaidu(req, res, baiduPath) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  var body = '';
  req.on('data', function(c) { body += c; });
  req.on('end', function() {
    var options = {
      hostname: 'aip.baidubce.com',
      port: 443,
      path: baiduPath,
      method: 'POST',
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'Accept': 'application/json',
      },
      timeout: 30000,
    };

    var proxyReq = https.request(options, function(proxyRes) {
      var chunks = [];
      proxyRes.on('data', function(c) { chunks.push(c); });
      proxyRes.on('end', function() {
        var resp = Buffer.concat(chunks).toString();
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(proxyRes.statusCode).send(resp);
      });
    });

    proxyReq.on('error', function(err) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(502).json({ error_code: 502, error_msg: '代理请求失败: ' + err.message });
    });
    proxyReq.on('timeout', function() {
      proxyReq.destroy();
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(504).json({ error_code: 504, error_msg: '代理请求超时' });
    });

    proxyReq.write(body);
    proxyReq.end();
  });
}

module.exports = { proxyToBaidu };
