# 数据库初始化指南

本文档介绍如何初始化和管理 Study Together 项目的数据库。

## 🚀 快速开始

### 完全初始化数据库（推荐）

```bash
# 重置数据库并填充种子数据
npm run db:init -- --force
```

### 仅添加种子数据

```bash
# 在现有数据库中添加种子数据
npm run db:init -- --seed-only
```

## 📋 可用命令

### 数据库初始化脚本

| 命令 | 描述 |
|------|------|
| `npm run db:init` | 显示帮助信息 |
| `npm run db:init -- --force` | 完全重置数据库并填充种子数据 |
| `npm run db:init -- --seed-only` | 仅运行种子数据脚本 |
| `npm run db:init -- --help` | 显示详细帮助 |

### Prisma 命令

| 命令 | 描述 |
|------|------|
| `npm run db:reset` | 重置数据库（删除所有数据） |
| `npm run db:seed` | 运行种子数据脚本 |
| `npm run db:generate` | 生成 Prisma 客户端 |
| `npm run db:migrate` | 运行数据库迁移 |
| `npm run db:studio` | 打开 Prisma Studio 数据库管理界面 |

## 🎯 默认账户

初始化完成后，系统会创建以下测试账户：

### 管理员账户
- **用户名**: `admin`
- **密码**: `admin123`
- **权限**: 系统管理员

### 测试用户
- **用户名**: `alice` / **密码**: `user123` （女性用户）
- **用户名**: `bob` / **密码**: `user123` （男性用户）
- **用户名**: `charlie` / **密码**: `user123` （考研用户）
- **用户名**: `diana` / **密码**: `user123` （留学用户）

### 版主账户
- **用户名**: `moderator`
- **密码**: `mod123`
- **权限**: 版主

## 📊 初始化数据内容

### 1. 用户数据
- 6个测试用户（包含不同角色和性别）
- 完整的用户资料信息
- 加密的密码存储

### 2. 情侣关系
- Alice 和 Bob 的情侣关系
- 完整的情侣配对数据

### 3. 学习数据
- 学习目标（考研、技能提升等）
- 学习计划和任务
- 不同类型的学习任务

### 4. 留言墙
- 情侣间的私密留言
- 公开的励志留言
- 不同类型的消息格式

### 5. AI 聊天
- 示例聊天对话
- 学习计划咨询记录

### 6. 系统设置
- 安全策略配置
- 站点功能开关
- 主题和限制设置

## 🔧 高级用法

### 自定义种子数据

编辑 `prisma/seed.ts` 文件来自定义初始化数据：

```typescript
// 添加更多用户
const users = [
  {
    username: 'newuser',
    email: 'newuser@example.com',
    displayName: '新用户',
    password: 'password123',
    role: 'USER' as const,
    status: 'ACTIVE' as const,
    gender: 'OTHER' as const,
    bio: '这是一个新用户',
  },
  // ... 更多用户
];
```

### 环境配置

确保 `.env` 文件包含正确的数据库配置：

```env
DATABASE_URL="postgresql://username:password@localhost:5432/studytogether"
```

### 生产环境注意事项

⚠️ **警告**: 不要在生产环境中运行种子数据脚本，因为它包含测试账户和密码。

生产环境建议：
1. 仅运行数据库迁移：`npm run db:migrate`
2. 手动创建管理员账户
3. 配置适当的安全设置

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 `.env` 文件中的 `DATABASE_URL`
   - 确保数据库服务正在运行

2. **权限错误**
   - 确保数据库用户有创建/删除表的权限
   - 检查文件系统权限

3. **迁移失败**
   - 删除 `prisma/migrations` 目录
   - 重新运行 `npm run db:migrate`

4. **种子数据重复**
   - 脚本会自动检查重复数据
   - 使用 `--force` 参数完全重置

### 重置到干净状态

```bash
# 完全清理并重新初始化
rm -rf prisma/migrations
npm run db:init -- --force
```

## 📚 相关文档

- [Prisma 官方文档](https://www.prisma.io/docs/)
- [数据库 Schema 设计](../prisma/schema.prisma)
- [API 文档](./api-documentation.md)

## 🤝 贡献

如果你想改进数据库初始化脚本：

1. 编辑 `prisma/seed.ts` 添加新的种子数据
2. 更新 `scripts/init-db.js` 改进初始化流程
3. 更新此文档反映变更

---

💡 **提示**: 使用 `npm run db:studio` 可以在浏览器中可视化管理数据库数据。