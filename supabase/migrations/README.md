# 数据库迁移管理

## 文件结构

- **DATABASE_RESET.sql**: 主要数据库定义文件，包含最新的完整数据库架构
- **auth_and_security.sql**: 认证和安全策略文件
- **archived/**: 存放已整合到主文件的历史补丁文件

## 版本管理

数据库架构使用 `schema_migrations` 表进行版本管理。当前版本为 1.3.0。

## 迁移流程

1. 对于小型修改，先创建单独的迁移文件 (如 `20250411_fix_payment_trigger.sql`)
2. 测试并应用迁移
3. 将修改整合到 `DATABASE_RESET.sql` 或 `auth_and_security.sql` 文件中
4. 更新相应文件顶部的版本号和更新日志
5. 将已整合的迁移文件移动到 `archived/` 目录

## 应用迁移

对于新环境或完全重置：

```bash
# 执行脚本
./apply_all.sh <supabase项目ID>
```

或手动执行：

```bash
# 1. 执行主要重置脚本
psql -f DATABASE_RESET.sql

# 2. 执行认证和安全设置
psql -f auth_and_security.sql
```

## 最近更新 (版本1.3.0)

1. 整合 `drop_duplicate_function.sql` 到 `DATABASE_RESET.sql`
2. 修复重复函数定义和价格字段访问问题
3. 进一步精简应用脚本，减少所需执行的SQL文件数量

## 历史更新 (版本1.2.0)

1. 整合 `setup_auth.sql` 和 `update_rls_policies.sql` 到 `auth_and_security.sql`
2. 整合 `update_create_order.sql` 到 `DATABASE_RESET.sql`
3. 精简应用脚本，减少所需执行的SQL文件数量

## 最佳实践

- 定期将新的迁移整合到主文件中
- 保持迁移文件的幂等性，使其可以重复执行
- 使用版本号和时间戳命名迁移文件
- 在迁移文件中添加详细注释 