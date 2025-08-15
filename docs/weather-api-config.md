# 和风天气API配置指南

本文档说明如何在Study-Together项目中正确配置和风天气API。

## 环境变量配置

在项目根目录的 `.env` 文件中添加以下配置：

```bash
# 和风天气API配置
NEXT_PUBLIC_QWEATHER_API_KEY=your_api_key_here
NEXT_PUBLIC_QWEATHER_API_HOST=your_api_host.qweatherapi.com
```

### 获取API凭据

1. 访问 [和风天气开发者控制台](https://dev.qweather.com/)
2. 注册账号并创建项目
3. 在控制台中获取：
   - **API KEY**: 用于身份认证
   - **API Host**: 你的专用API域名

## API请求最佳实践

根据和风天气官方文档，我们的实现包含以下最佳实践：

### 1. 身份认证

使用API KEY认证方式，在请求头中添加：
```javascript
headers: {
  'X-QW-Api-Key': API_KEY
}
```

### 2. Gzip压缩

和风天气API使用Gzip压缩来减少网络流量，在请求头中添加：
```javascript
headers: {
  'Accept-Encoding': 'gzip, deflate, br'
}
```

### 3. User-Agent标识

添加应用标识：
```javascript
headers: {
  'User-Agent': 'Study-Together-Weather/1.0'
}
```

### 4. 完整的请求示例

```javascript
const response = await fetch(weatherUrl, {
  method: 'GET',
  headers: {
    'X-QW-Api-Key': API_KEY,
    'Accept-Encoding': 'gzip, deflate, br',
    'User-Agent': 'Study-Together-Weather/1.0'
  }
})
```

## API端点

项目中使用的API端点：

1. **实时天气**: `/v7/weather/now`
   - 参数: `location={longitude},{latitude}`
   - 返回当前天气数据

2. **地理位置查询**: `/v2/city/lookup`
   - 参数: `location={longitude},{latitude}`
   - 返回位置名称信息

## 错误处理

- API响应状态码不为200时，抛出网络错误
- API返回code不为'200'时，抛出业务错误
- 发生错误时，自动降级到模拟数据

## 演示模式

当API_KEY为'demo_key'时，系统会：
1. 仍然尝试获取地理位置权限
2. 使用模拟天气数据
3. 不发送实际API请求

这样可以在没有API凭据时也能测试地理位置功能。

## 安全注意事项

- API KEY是敏感信息，不要在客户端代码中硬编码
- 使用环境变量管理API凭据
- 在日志中隐藏API KEY信息
- 考虑在生产环境中使用服务端代理来保护API KEY

## 测试

天气组件已简化为仅使用IP定位功能：
- 自动通过IP地址获取位置信息
- 无需用户授权地理位置权限
- 如果IP定位失败，将使用北京作为默认位置