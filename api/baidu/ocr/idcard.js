// Vercel Serverless Function: 百度身份证识别代理
var proxy = require('../_proxy');

module.exports = function handler(req, res) {
  proxy.proxyToBaidu(req, res, '/rest/2.0/ocr/v1/idcard');
};
