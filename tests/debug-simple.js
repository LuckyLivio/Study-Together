// 简单的按钮调试脚本
console.log('🔍 开始简单调试...');

// 查找所有按钮
const buttons = document.querySelectorAll('button');
console.log('📋 页面按钮总数:', buttons.length);

// 遍历所有按钮
buttons.forEach((button, index) => {
  const text = button.textContent?.trim() || '';
  console.log(`按钮 ${index + 1}: "${text}" - disabled: ${button.disabled}`);
  
  // 检查是否是生成邀请码按钮
  if (text.includes('生成邀请码') || text.includes('重新生成邀请码') || text.includes('已创建邀请')) {
    console.log('✅ 找到目标按钮!');
    console.log('按钮详情:');
    console.log('- 文本:', text);
    console.log('- 禁用状态:', button.disabled);
    console.log('- 类名:', button.className);
    console.log('- 父元素:', button.parentElement);
    console.log('- onClick:', button.onclick);
    
    // 检查事件监听器
    if (typeof getEventListeners === 'function') {
      console.log('- 事件监听器:', getEventListeners(button));
    }
    
    // 添加测试点击函数
    window.testClick = () => {
      console.log('🖱️ 手动触发点击事件...');
      button.click();
    };
    
    // 添加直接调用onClick的函数
    window.testDirectClick = () => {
      console.log('🎯 直接调用onClick...');
      if (button.onclick) {
        button.onclick();
      } else {
        console.log('❌ 没有onclick处理器');
      }
    };
    
    console.log('💡 可以运行 testClick() 或 testDirectClick() 来测试');
  }
});

// 检查React组件状态
if (window.React) {
  console.log('✅ React已加载');
} else {
  console.log('❌ React未加载');
}

// 检查是否有错误
window.addEventListener('error', (e) => {
  console.error('❌ JavaScript错误:', e.error);
});

console.log('🏁 调试脚本加载完成');