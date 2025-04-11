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

### 最新更新：解决行级安全策略（RLS）冲突

在修复认证问题后，我们发现了一个新的问题：`new row violates row-level security policy for table "orders"`。这是因为切换到 Supabase Auth 服务后，原有的行级安全策略不再适用。为解决此问题，我们做了以下更改：

1. 创建了 `update_rls_policies.sql` 文件，更新RLS策略以兼容Supabase Auth
2. 添加了 `auth.get_user_role()` 和 `auth.get_user_db_id()` 辅助函数，从用户元数据中提取角色和数据库ID
3. 更新了 `create_order` 函数，使其支持Auth服务并增强了安全检查
4. 为 `seats` 表添加了更宽松的更新策略，允许客户在下单时更新座位状态
5. 调整了函数权限，确保认证用户可以执行必要的操作

### 最新更新：修复函数重载冲突

在系统使用中，我们发现了一个新问题：`Could not choose the best candidate function between: public.create_order(...), public.create_order(...)`。这是因为数据库中存在两个函数签名几乎相同的`create_order`函数，只是`p_ticket_type`参数类型不同（一个是`character varying`，另一个是`text`）。为解决此问题，我们：

1. 创建了 `drop_duplicate_function.sql` 文件，删除所有版本的`create_order`函数
2. 重新创建单一版本的`create_order`函数，使用`TEXT`类型参数
3. 确保新函数具有完整的权限检查并兼容Supabase Auth服务
4. 授予适当的执行权限给必要的数据库角色

### 最新更新：修复价格字段访问错误

执行新的`create_order`函数后，我们发现一个错误：`record "v_showtime" has no field "price"`。这是因为数据库中`showtimes`表没有名为"price"的字段，而是使用单独的字段`price_normal`, `price_student`等。为解决这个问题，我们：

1. 更新了`drop_duplicate_function.sql`文件中的`create_order`函数实现
2. 添加了`v_base_price`变量来根据票型存储正确的价格
3. 使用`CASE`语句从`v_showtime`记录中获取对应票型的价格字段
4. 在计算座位价格时使用基础票价乘以座位类型对应的乘数

### 如何应用这些更改

请按照以下步骤应用修复：

1. 确保你已经将代码更新到最新版本
2. 登录到 Supabase 管理控制台，选择你的项目
3. 转到 SQL 编辑器，然后依次执行以下SQL脚本：

   a. 如果数据库是新的或需要重置：先执行 `supabase/migrations/DATABASE_RESET.sql`
   b. 执行 `supabase/migrations/auth_and_security.sql`（替代之前的三个分散文件）
   c. 执行 `supabase/migrations/setup_auth.sql`（用于设置用户认证）
   d. 执行 `supabase/migrations/update_create_order.sql`（用于更新订单创建逻辑）
   e. 执行 `supabase/migrations/update_rls_policies.sql`（用于更新行级安全策略）
   f. **执行 `supabase/migrations/drop_duplicate_function.sql`（用于修复函数重载冲突和价格字段访问错误）**

4. 执行脚本后，重启应用程序

> **注意**：新的认证方法使用 Supabase 内置的 Auth 服务，不再依赖自定义 JWT 生成函数，同时新的RLS策略使用Auth服务的用户元数据进行权限检查。最新的`create_order`函数已经统一为单一版本，使用`TEXT`类型参数，避免了函数重载冲突，并正确处理了票价计算。

### 验证修复

应用这些更改后，你的应用程序应该能够：

1. 正常登录和注册用户
2. 访问所有数据表，包括电影、影厅和场次信息，而不会出现权限错误 
3. 根据当前用户的角色正确应用行级安全策略
4. 匿名用户应该能够查询用户表以进行登录验证
5. 不再出现 `function sign(json, text) does not exist` 错误
6. 成功使用 Supabase Auth 服务进行身份验证
7. 成功创建订单，不再出现行级安全策略冲突错误
8. 顺利完成购票流程并与数据库交互
9. 不再出现函数重载冲突错误
10. **不再出现 `record "v_showtime" has no field "price"` 错误**

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
- **`showtimes`表中的票价不是使用`price`字段，而是使用`price_normal`, `price_student`等单独字段**

### 文件结构优化

我们对SQL文件结构进行了以下优化：

| 之前的文件 | 现在的文件 | 备注 |
|------------|------------|------|
| create_session_function.sql | auth_and_security.sql | 整合到一个文件中 |
| rls_policies.sql | auth_and_security.sql | 整合到一个文件中 |
| enable_rpc_functions.sql | auth_and_security.sql | 整合到一个文件中 |
| - | setup_auth.sql | 新增文件，设置Auth服务 |
| - | update_rls_policies.sql | 新增文件，更新权限策略 |
| - | update_create_order.sql | 新增文件，更新订单创建逻辑 |
| - | drop_duplicate_function.sql | 新增文件，修复函数重载冲突和价格访问错误 |

### 认证方式的变更

系统认证方式已从自定义JWT方式切换到Supabase内置Auth服务：

| 之前的认证方式 | 现在的认证方式 | 备注 |
|--------------|--------------|------|
| 自定义RPC函数生成JWT | Supabase Auth服务 | 解决pgcrypto扩展缺失问题 |
| JWT绕过API | 标准Auth API | 更加安全和可靠 |
| 直接设置会话令牌 | 使用Auth API登录 | 更好的会话管理 |
| 基于JWT声明的RLS | 基于Auth元数据的RLS | 更灵活的权限控制 |

### 故障排除

如果你仍然遇到问题：

1. 检查浏览器控制台，查看是否有API错误
2. 确保 Supabase URL 和 Anon Key 正确设置在环境变量中
3. 尝试注销并重新登录以获取新的会话令牌
4. 清除浏览器本地存储并重新登录
5. 如果遇到视图相关错误，请确保执行了 `DATABASE_RESET.sql` 脚本创建所有视图
6. 如果出现与认证相关的错误，请确保执行了 `setup_auth.sql` 脚本
7. 如果出现行级安全策略错误，请确保执行了 `update_rls_policies.sql` 和 `update_create_order.sql` 脚本
8. 如果出现函数重载冲突错误，请确保执行了 `drop_duplicate_function.sql` 脚本
9. **如果出现价格字段访问错误，确保使用了最新版本的`drop_duplicate_function.sql`**

如有更多问题，请联系系统管理员。 

执行脚本的建议顺序:
1. DATABASE_RESET.sql（如果需要重置）
2. auth_and_security.sql
3. drop_duplicate_function.sql

## 数据库迁移管理（新）

从2025年4月起，我们开始使用新的数据库迁移管理方法，旨在减少分散的SQL文件，提高维护性。

### 新的迁移管理方式

1. **使用版本化的DATABASE_RESET.sql**
   - 所有数据库定义集中到一个文件
   - 文件顶部添加版本号和更新日志
   - 数据库包含schema_migrations表追踪版本

2. **迁移目录结构**
   - `migrations/DATABASE_RESET.sql` - 主文件，包含完整数据库定义
   - `migrations/auth_and_security.sql` - 认证和安全策略
   - `migrations/drop_duplicate_function.sql` - 特殊修复
   - `migrations/archive/` - 归档的历史迁移文件
   - `migrations/README.md` - 迁移管理说明

3. **迁移流程**
   - 小更改：创建独立迁移文件 → 测试 → 整合到主文件 → 归档
   - 大更改：直接在主文件中更新，并更新版本号

### 最新更新

**v1.2.0 (2025-04-11)**
- 整合了分散的迁移文件到主要文件中
- setup_auth.sql和update_rls_policies.sql整合到auth_and_security.sql
- update_create_order.sql整合到DATABASE_RESET.sql
- 更新apply_all.sh脚本，简化迁移过程

**v1.1.0 (2025-04-11)**
- 修复支付触发器，使其同时支持'success'和'completed'状态
- 添加支付记录更新触发器，确保状态更新时也能触发订单状态更新
- 改进数据库迁移管理流程

详细信息请查看 `migrations/README.md`。