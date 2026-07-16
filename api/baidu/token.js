// Vercel Serverless Function: 百度 OCR OAuth Token 代理
var proxy = require('./_proxy');

module.exports = function handler(req, res) {
  proxy.proxyToBaidu(req, res, '/oauth/2.0/token');
};
