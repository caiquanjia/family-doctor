// Vercel Serverless Function: 百度通用文字识别代理
var proxy = require('../_proxy');

module.exports = function handler(req, res) {
  proxy.proxyToBaidu(req, res, '/rest/2.0/ocr/v1/accurate_basic');
};
