var crypto = require('crypto');

// 生成HMAC-MD5哈希值的函数
function generateHMACMD5(password, token) {
  // 创建一个HMAC-MD5哈希对象，使用token作为密钥
  var hmac = crypto.createHmac('md5', token);
  
  // 更新哈希对象的输入为password
  hmac.update(password);
  
  // 计算哈希值并以十六进制格式返回
  var hmacMD5Hash = hmac.digest('hex');
  
  return hmacMD5Hash;
}

module.exports = { generateHMACMD5 };