// 测试API密钥字符编码
const fs = require('fs');
const path = require('path');

// 读取.env文件
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// 查找DEEPSEEK_API_KEY行
const lines = envContent.split('\n');
const apiKeyLine = lines.find(line => line.startsWith('DEEPSEEK_API_KEY='));

if (apiKeyLine) {
  const apiKey = apiKeyLine.split('=')[1].replace(/"/g, '');
  
  console.log('API Key:', apiKey);
  console.log('API Key length:', apiKey.length);
  
  // 检查每个字符的编码
  for (let i = 0; i < apiKey.length; i++) {
    const char = apiKey[i];
    const charCode = char.charCodeAt(0);
    console.log(`Character ${i}: '${char}' (code: ${charCode})`);
    
    if (charCode > 255) {
      console.log(`❌ Character at index ${i} has value ${charCode} which is greater than 255`);
    }
  }
  
  // 测试Buffer转换
  try {
    const buffer = Buffer.from(apiKey, 'utf8');
    console.log('✅ Buffer conversion successful');
    console.log('Buffer:', buffer.toString('hex'));
  } catch (error) {
    console.log('❌ Buffer conversion failed:', error.message);
  }
  
} else {
  console.log('❌ DEEPSEEK_API_KEY not found in .env file');
}