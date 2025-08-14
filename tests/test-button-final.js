const puppeteer = require('puppeteer');

async function testButtonFinal() {
  let browser;
  
  try {
    console.log('🚀 启动最终按钮测试...');
    
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
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
    
    // 等待页面加载完成
    await page.waitForTimeout(2000);
    
    console.log('🔍 查找生成邀请码按钮...');
    
    // 查找按钮
    const button = await page.$('button:has-text("生成邀请码"), button:has-text("重新生成邀请码"), button:has-text("已创建邀请")');
    
    if (!button) {
      // 尝试其他方式查找按钮
      const buttons = await page.$$('button');
      console.log(`📋 页面上共有 ${buttons.length} 个按钮`);
      
      for (let i = 0; i < buttons.length; i++) {
        const text = await buttons[i].textContent();
        console.log(`按钮 ${i + 1}: "${text}"`);
        
        if (text && (text.includes('生成邀请码') || text.includes('重新生成邀请码') || text.includes('已创建邀请'))) {
          console.log('✅ 找到目标按钮!');
          
          // 检查按钮状态
          const isDisabled = await buttons[i].evaluate(btn => btn.disabled);
          console.log('按钮禁用状态:', isDisabled);
          
          if (!isDisabled) {
            console.log('🖱️ 点击按钮...');
            await buttons[i].click();
            
            // 等待一段时间观察结果
            console.log('⏳ 等待5秒观察结果...');
            await page.waitForTimeout(5000);
            
            console.log('✅ 测试完成！请查看浏览器中的结果');
          } else {
            console.log('⚠️ 按钮被禁用，无法点击');
          }
          break;
        }
      }
    }
    
    // 保持浏览器打开
    console.log('💡 浏览器保持打开状态，请手动查看结果');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
  
  // 不关闭浏览器，让用户手动查看
}

testButtonFinal();