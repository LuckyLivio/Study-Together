#!/bin/bash

# 服务器更新脚本 - 清除缓存并重新部署

echo "🚀 开始更新服务器..."

# 1. 停止当前运行的应用
echo "📱 停止应用..."
pm2 stop study-together 2>/dev/null || echo "应用未运行"

# 2. 清除 Next.js 缓存
echo "🧹 清除缓存..."
rm -rf .next
rm -rf node_modules/.cache

# 3. 重新安装依赖（可选）
echo "📦 检查依赖..."
npm ci --production

# 4. 重新构建项目
echo "🔨 构建项目..."
npm run build

# 5. 重新启动应用
echo "🚀 启动应用..."
pm2 start study-together || pm2 restart study-together

# 6. 重启 Nginx
echo "🌐 重启 Nginx..."
sudo systemctl restart nginx

# 7. 检查状态
echo "✅ 检查状态..."
pm2 status
sudo systemctl status nginx --no-pager -l

echo "🎉 更新完成！"
echo "📝 请访问网站检查更新是否生效"
echo "💡 如果仍未更新，请尝试清除浏览器缓存（Ctrl+F5）"