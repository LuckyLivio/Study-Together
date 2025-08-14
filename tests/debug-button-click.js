// 简单的按钮点击测试脚本
// 在浏览器控制台中运行这个脚本来测试按钮点击

console.log('🔍 开始调试按钮点击问题...');

// 查找生成邀请码按钮
const findGenerateButton = () => {
  // 尝试多种方式查找按钮
  const buttons = document.querySelectorAll('button');
  console.log('📋 页面上的所有按钮:', buttons.length);
  
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
};

// 测试按钮点击
const testButtonClick = () => {
  const button = findGenerateButton();
  
  if (!button) {
    console.log('❌ 无法找到按钮，测试失败');
    return;
  }
  
  console.log('🔍 按钮详细信息:');
  console.log('- 文本:', button.textContent);
  console.log('- 禁用状态:', button.disabled);
  console.log('- 类名:', button.className);
  console.log('- onClick事件:', button.onclick);
  console.log('- 事件监听器:', getEventListeners ? getEventListeners(button) : '需要在开发者工具中查看');
  
  if (button.disabled) {
    console.log('⚠️ 按钮被禁用，无法点击');
    return;
  }
  
  console.log('🖱️ 尝试模拟点击...');
  
  // 模拟点击事件
  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  });
  
  button.dispatchEvent(clickEvent);
  console.log('✅ 点击事件已触发');
};

// 运行测试
testButtonClick();

// 提供手动测试函数
window.debugButtonClick = testButtonClick;
console.log('💡 您也可以手动运行: debugButtonClick()');