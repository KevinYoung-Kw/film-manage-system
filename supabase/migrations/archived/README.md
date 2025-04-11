# 已归档的迁移文件

此目录包含已被整合到主要 `DATABASE_RESET.sql` 文件中的历史迁移文件。这些文件保留用于历史参考，但不应在新环境中直接执行。

## 归档文件列表

| 文件名 | 描述 | 整合版本 | 归档日期 |
|--------|------|----------|----------|
| setup_auth.sql | 设置Supabase Auth服务 | 1.2.0 | 2025-04-11 |
| update_rls_policies.sql | 更新行级安全策略以适配Supabase Auth | 1.2.0 | 2025-04-11 |
| update_create_order.sql | 更新订单创建函数 | 1.2.0 | 2025-04-11 |
| 20250411_fix_payment_trigger.sql | 修复支付触发器同时支持success和completed状态 | 1.1.0 | 2025-04-11 |

## 注意事项

- 这些文件仅作为历史记录保存
- 所有这些更改已包含在最新的 `DATABASE_RESET.sql` 和 `auth_and_security.sql` 中
- 如果需要查看特定更改的历史，请参考这些文件 