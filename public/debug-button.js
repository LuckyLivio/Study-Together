// 调试按钮点击的脚本
// 在浏览器控制台中运行: loadScript('/debug-button.js')

console.log('🔍 开始调试生成邀请码按钮...');

// 查找按钮的函数
function findGenerateButton() {
  const buttons = document.querySelectorAll('button');
  console.log('📋 页面上的按钮数量:', buttons.length);
  
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const text = button.textContent || button.innerText;
    console.log(`按钮 ${i + 1}: "${text.trim()}" - disabled: ${button.disabled}`);
    
    if (text.includes('生成邀请码') || text.includes('重新生成邀请码') || text.includes('已创建邀请')) {
      console.log('✅ 找到生成邀请码按钮:', button);
      return button;
    }
  }
  
  console.log('❌ 未找到生成邀请码按钮');
  return null;
}

// 测试按钮点击
function testButtonClick() {
  const button = findGenerateButton();
  
  if (!button) {
    console.log('❌ 无法找到按钮，测试失败');
    return;
  }
  
  console.log('🔍 按钮详细信息:');
  console.log('- 文本:', button.textContent);
  console.log('- 禁用状态:', button.disabled);
  console.log('- 类名:', button.className);
  console.log('- 父元素:', button.parentElement);
  
  if (button.disabled) {
    console.log('⚠️ 按钮被禁用，无法点击');
    return;
  }
  
  console.log('🖱️ 尝试模拟点击...');
  
  // 添加临时的点击监听器来验证事件是否触发
  const originalHandler = button.onclick;
  button.addEventListener('click', function(e) {
    console.log('🎯 点击事件被触发!', e);
  }, { once: true });
  
  // 模拟点击事件
  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  });
  
  button.dispatchEvent(clickEvent);
  console.log('✅ 点击事件已发送');
  
  // 也尝试直接调用 click 方法
  setTimeout(() => {
    console.log('🖱️ 尝试直接调用 click() 方法...');
    button.click();
  }, 1000);
}

// 监听网络请求
function monitorNetworkRequests() {
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    console.log('🌐 网络请求:', args[0]);
    return originalFetch.apply(this, args)
      .then(response => {
        console.log('📡 响应:', response.status, response.url);
        return response;
      })
      .catch(error => {
        console.log('❌ 网络错误:', error);
        throw error;
      });
  };
  
  console.log('✅ 网络请求监听已启用');
}

// 启动调试
monitorNetworkRequests();
testButtonClick();

// 提供手动测试函数
window.debugButton = testButtonClick;
window.findButton = findGenerateButton;

console.log('💡 调试函数已添加:');
console.log('- debugButton() - 测试按钮点击');
console.log('- findButton() - 查找按钮');