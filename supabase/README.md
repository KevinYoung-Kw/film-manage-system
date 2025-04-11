# Supabase 配置和迁移指南

本目录包含了 Supabase 数据库的配置文件和迁移脚本。

## 修复认证问题

系统中出现了一个认证相关的问题，导致API调用收到 `401 Unauthorized` 错误和 `permission denied for table movies` 等错误消息。这是因为我们之前使用的自定义JWT格式不符合Supabase的要求。

### 解决方案

我们已经实现了以下更改来修复此问题：

1. 修改了 `supabaseClient.ts` 以使用正确的JWT会话管理
2. 更新了 `authService.ts` 以支持新的认证方式
3. 创建了必要的SQL迁移脚本来支持认证
4. 修正了表名引用错误（将 `bookings`/`booking_seats` 更正为 `orders`/`order_seats`）
5. 修正了视图权限问题（视图不支持RLS策略，改用授权语句）
6. 优化了视图授权方式，添加存在性检查避免错误
7. **修复了匿名用户无法查询用户表的问题**
8. **整合了多个认证相关SQL文件为一个统一的文件**

### 最新更新：解决 pgcrypto 缺失问题

我们发现在尝试使用自定义创建会话方法时，会出现错误 `function sign(json, text) does not exist`。这表明数据库中缺少 pgcrypto 扩展。为解决此问题，我们做了以下重大更改：

1. **切换到使用 Supabase 内置的 Auth 服务**，而不再使用自定义 JWT 令牌
2. 创建了 `setup_auth.sql` 文件，用于安装必要的扩展并为现有用户配置 Auth 服务
3. 修改了 `supabaseClient.ts` 和 `authService.ts` 文件，改为使用 Supabase Auth 服务登录
4. 为用户创建了一种可预测但安全的密码生成方式，便于系统内部使用

### 如何应用这些更改

请按照以下步骤应用修复：

1. 确保你已经将代码更新到最新版本
2. 登录到 Supabase 管理控制台，选择你的项目
3. 转到 SQL 编辑器，然后依次执行以下SQL脚本：

   a. 如果数据库是新的或需要重置：先执行 `supabase/migrations/DATABASE_RESET.sql`
   b. 执行 `supabase/migrations/auth_and_security.sql`（替代之前的三个分散文件）
   c. **执行 `supabase/migrations/setup_auth.sql`（新增，用于设置用户认证）**

4. 执行脚本后，重启应用程序

> **注意**：新的认证方法使用 Supabase 内置的 Auth 服务，不再依赖自定义 JWT 生成函数。

### 验证修复

应用这些更改后，你的应用程序应该能够：

1. 正常登录和注册用户
2. 访问所有数据表，包括电影、影厅和场次信息，而不会出现权限错误 
3. 根据当前用户的角色正确应用行级安全策略
4. 匿名用户应该能够查询用户表以进行登录验证
5. **不再出现 `function sign(json, text) does not exist` 错误**
6. **成功使用 Supabase Auth 服务进行身份验证**

## 附加信息

### 表结构和视图说明

系统使用的主要表包括：

1. `users` - 用户信息表
2. `movies` - 电影表
3. `theaters` - 影厅表 
4. `showtimes` - 场次表
5. `seats` - 座位表
6. `orders` - 订单表（不是 bookings）
7. `order_seats` - 订单座位关联表（不是 booking_seats）

视图（不能应用RLS策略）：
1. `vw_today_showtimes` - 今日场次视图
2. `vw_movie_statistics` - 电影统计视图
3. `vw_now_showing_movies` - 正在上映电影视图
4. `vw_coming_soon_movies` - 即将上映电影视图

请注意：
- 数据库设计中使用的是 `orders` 和 `order_seats`，而不是 `bookings` 和 `booking_seats`
- PostgreSQL 中视图不支持行级安全策略(RLS)，而是通过授权(`GRANT`)语句控制访问权限
- 视图需要先执行 `DATABASE_RESET.sql` 创建，否则 `auth_and_security.sql` 中的视图授权会被跳过

### 文件结构优化

我们对SQL文件结构进行了以下优化：

| 之前的文件 | 现在的文件 | 备注 |
|------------|------------|------|
| create_session_function.sql | auth_and_security.sql | 整合到一个文件中 |
| rls_policies.sql | auth_and_security.sql | 整合到一个文件中 |
| enable_rpc_functions.sql | auth_and_security.sql | 整合到一个文件中 |
| - | setup_auth.sql | 新增文件，设置Auth服务 |

### 认证方式的变更

系统认证方式已从自定义JWT方式切换到Supabase内置Auth服务：

| 之前的认证方式 | 现在的认证方式 | 备注 |
|--------------|--------------|------|
| 自定义RPC函数生成JWT | Supabase Auth服务 | 解决pgcrypto扩展缺失问题 |
| JWT绕过API | 标准Auth API | 更加安全和可靠 |
| 直接设置会话令牌 | 使用Auth API登录 | 更好的会话管理 |

### 故障排除

如果你仍然遇到问题：

1. 检查浏览器控制台，查看是否有API错误
2. 确保 Supabase URL 和 Anon Key 正确设置在环境变量中
3. 尝试注销并重新登录以获取新的会话令牌
4. 清除浏览器本地存储并重新登录
5. 如果遇到视图相关错误，请确保执行了 `DATABASE_RESET.sql` 脚本创建所有视图
6. 如果出现与认证相关的错误，请确保执行了 `setup_auth.sql` 脚本

如有更多问题，请联系系统管理员。 