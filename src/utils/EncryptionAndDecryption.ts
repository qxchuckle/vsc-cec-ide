import * as crypto from 'crypto';

// 加密函数
export function encrypt(text: string, password: string) {
  const salt = crypto.randomBytes(16); // 生成随机的盐值
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256'); // 从密码生成密钥
  const iv = crypto.randomBytes(16); // 生成随机的初始化向量
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return `${salt.toString('hex')}:${iv.toString('hex')}:${encrypted}`;
}

// 解密函数
export function decrypt(encryptedText: string, password: string) {
  const [saltHex, ivHex, encryptedData] = encryptedText.split(':');
  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256'); // 从密码生成密钥
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
}