# 数据库脚本

这个目录包含了数据库管理相关的脚本。

## 文件说明

### `init-db.js`
数据库初始化脚本，用于设置完整的开发环境。

**功能：**
- 重置数据库（可选）
- 运行数据库迁移
- 生成 Prisma 客户端
- 填充种子数据
- 环境检查和验证

**使用方法：**
```bash
# 显示帮助
npm run db:init -- --help

# 完全重置数据库并填充数据
npm run db:init -- --force

# 仅添加种子数据
npm run db:init -- --seed-only
```

### `fix-passwords.js`
密码修复脚本，用于修复用户密码相关问题。

## 使用建议

1. **首次设置**：使用 `npm run db:init -- --force`
2. **添加测试数据**：使用 `npm run db:init -- --seed-only`
3. **重置开发环境**：使用 `npm run db:init -- --force`

## 注意事项

- 确保 `.env` 文件配置正确
- 在生产环境中谨慎使用 `--force` 选项
- 脚本会自动检查环境和依赖

更多详细信息请参考 [数据库设置指南](../docs/database-setup.md)。