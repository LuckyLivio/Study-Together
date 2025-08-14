// 直接测试按钮点击的脚本
const puppeteer = require('puppeteer');

async function testButtonClick() {
  console.log('🚀 启动浏览器测试...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // 显示浏览器窗口
    devtools: true   // 打开开发者工具
  });
  
  try {
    const page = await browser.newPage();
    
    // 监听控制台消息
    page.on('console', msg => {
      console.log('🖥️ 浏览器控制台:', msg.text());
    });
    
    // 监听页面错误
    page.on('pageerror', error => {
      console.log('❌ 页面错误:', error.message);
    });
    
    console.log('📱 导航到个人资料页面...');
    await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle0' });
    
    // 等待页面加载
    await page.waitForTimeout(2000);
    
    console.log('🔍 查找生成邀请码按钮...');
    
    // 查找按钮
    const button = await page.$('button:has-text("生成邀请码")');
    if (!button) {
      console.log('❌ 未找到生成邀请码按钮');
      
      // 列出所有按钮
      const allButtons = await page.$$eval('button', buttons => 
        buttons.map(btn => ({
          text: btn.textContent?.trim(),
          disabled: btn.disabled,
          className: btn.className
        }))
      );
      
      console.log('📋 页面上的所有按钮:', allButtons);
      return;
    }
    
    console.log('✅ 找到按钮，检查状态...');
    
    const buttonInfo = await page.evaluate((btn) => ({
      text: btn.textContent?.trim(),
      disabled: btn.disabled,
      className: btn.className
    }), button);
    
    console.log('🔍 按钮信息:', buttonInfo);
    
    if (buttonInfo.disabled) {
      console.log('⚠️ 按钮被禁用，无法点击');
      return;
    }
    
    console.log('🖱️ 点击按钮...');
    await button.click();
    
    // 等待响应
    await page.waitForTimeout(3000);
    
    console.log('✅ 测试完成');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    // 不关闭浏览器，让用户手动查看
    console.log('💡 浏览器保持打开状态，请手动查看结果');
  }
}

// 检查是否安装了puppeteer
try {
  testButtonClick();
} catch (error) {
  console.log('❌ 需要安装 puppeteer: npm install puppeteer');
  console.log('或者请手动在浏览器中测试:');
  console.log('1. 打开 http://localhost:3000/profile');
  console.log('2. 打开开发者工具 (F12)');
  console.log('3. 点击生成邀请码按钮');
  console.log('4. 查看控制台输出');
}