// 调试删除按钮点击问题的脚本
// 在浏览器控制台中运行这个脚本

console.log('🔍 开始调试删除按钮点击问题...');

// 查找所有删除按钮
function findDeleteButtons() {
  const buttons = document.querySelectorAll('button');
  const deleteButtons = [];
  
  buttons.forEach((button, index) => {
    const text = button.textContent?.trim() || '';
    if (text.includes('删除') && !text.includes('删除中')) {
      deleteButtons.push({
        element: button,
        index: index,
        text: text,
        disabled: button.disabled,
        className: button.className
      });
    }
  });
  
  return deleteButtons;
}

// 测试删除按钮
function testDeleteButtons() {
  const deleteButtons = findDeleteButtons();
  
  console.log(`📋 找到 ${deleteButtons.length} 个删除按钮`);
  
  deleteButtons.forEach((buttonInfo, index) => {
    console.log(`\n🔍 删除按钮 ${index + 1}:`);
    console.log('- 文本:', buttonInfo.text);
    console.log('- 禁用状态:', buttonInfo.disabled);
    console.log('- 类名:', buttonInfo.className);
    console.log('- 父元素:', buttonInfo.element.parentElement?.tagName);
    
    // 检查是否有 onClick 事件
    console.log('- onClick:', buttonInfo.element.onclick);
    
    // 检查事件监听器（如果可用）
    if (typeof getEventListeners === 'function') {
      const listeners = getEventListeners(buttonInfo.element);
      console.log('- 事件监听器:', listeners);
    }
    
    // 添加测试点击函数
    window[`testDeleteClick${index + 1}`] = () => {
      console.log(`🖱️ 测试点击删除按钮 ${index + 1}...`);
      
      if (buttonInfo.disabled) {
        console.log('⚠️ 按钮被禁用，无法点击');
        return;
      }
      
      // 添加临时的点击监听器
      const tempListener = (e) => {
        console.log('🎯 点击事件被触发!', e);
        console.log('- 事件类型:', e.type);
        console.log('- 目标元素:', e.target);
        console.log('- 是否冒泡:', e.bubbles);
      };
      
      buttonInfo.element.addEventListener('click', tempListener, { once: true });
      
      // 模拟点击
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      
      buttonInfo.element.dispatchEvent(clickEvent);
      console.log('✅ 点击事件已发送');
      
      // 也尝试直接调用 click 方法
      setTimeout(() => {
        console.log('🖱️ 尝试直接调用 click() 方法...');
        buttonInfo.element.click();
      }, 1000);
    };
    
    console.log(`💡 运行 testDeleteClick${index + 1}() 来测试这个按钮`);
  });
  
  return deleteButtons;
}

// 检查页面是否有课程数据
function checkCourseData() {
  const courseCards = document.querySelectorAll('[class*="Card"]');
  console.log('\n📊 页面统计:');
  console.log('- 卡片元素数量:', courseCards.length);
  
  const courseElements = document.querySelectorAll('[class*="course"], [data-course]');
  console.log('- 课程相关元素:', courseElements.length);
  
  // 查找课程名称
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const courseNames = [];
  headings.forEach(h => {
    const text = h.textContent?.trim();
    if (text && text.length > 0 && text.length < 50) {
      courseNames.push(text);
    }
  });
  console.log('- 可能的课程名称:', courseNames);
}

// 运行所有测试
function runAllTests() {
  console.log('🚀 开始完整测试...');
  checkCourseData();
  const deleteButtons = testDeleteButtons();
  
  if (deleteButtons.length === 0) {
    console.log('❌ 没有找到删除按钮，可能页面还没有加载完成或没有课程数据');
    console.log('💡 请确保：');
    console.log('1. 页面已完全加载');
    console.log('2. 已登录并有课程数据');
    console.log('3. 在课程列表页面运行此脚本');
  }
  
  return deleteButtons;
}

// 自动运行测试
const deleteButtons = runAllTests();

// 提供全局函数
window.debugDeleteButtons = runAllTests;
window.findDeleteButtons = findDeleteButtons;
window.checkCourseData = checkCourseData;

console.log('\n💡 可用的调试函数:');
console.log('- debugDeleteButtons() - 重新运行所有测试');
console.log('- findDeleteButtons() - 查找删除按钮');
console.log('- checkCourseData() - 检查课程数据');
if (deleteButtons.length > 0) {
  deleteButtons.forEach((_, index) => {
    console.log(`- testDeleteClick${index + 1}() - 测试删除按钮 ${index + 1}`);
  });
}