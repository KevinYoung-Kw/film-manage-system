# 电影票务系统 Supabase 数据库集成指南

本文档描述了如何将电影票务系统从使用模拟数据迁移到 Supabase 数据库。

## 集成架构

我们使用以下文件实现了 Supabase 集成：

1. **数据库定义**
   - `SQL_DESIGN_SCHEMA.sql` - 表结构定义
   - `SQL_VIEWS.sql` - 视图定义
   - `SQL_PROCEDURES.sql` - 存储过程定义
   - `SQL_TRIGGERS.sql` - 触发器定义
   - `SQL_SECURITY.sql` - 安全策略定义
   - `SQL_DATA_MIGRATION.sql` - 数据迁移脚本

2. **前端服务**
   - `app/lib/services/supabaseClient.ts` - Supabase 客户端配置
   - `app/lib/services/userService.ts` - 用户相关服务
   - `app/lib/services/movieService.ts` - 电影相关服务
   - `app/lib/types/database.types.ts` - Supabase 数据库类型定义

## 设置步骤

### 1. 创建 Supabase 项目

1. 注册 [Supabase](https://supabase.com/) 账号
2. 创建新项目
3. 记下项目 URL 和匿名密钥 (anon key)

### 2. 设置环境变量

在 `.env.local` 文件中添加：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 执行数据库脚本

按顺序执行以下 SQL 脚本：

1. SQL_DESIGN_SCHEMA.sql
2. SQL_PROCEDURES.sql
3. SQL_TRIGGERS.sql
4. SQL_VIEWS.sql
5. SQL_SECURITY.sql
6. SQL_DATA_MIGRATION.sql

### 4. 安装依赖

```bash
npm install @supabase/supabase-js
```

## 服务迁移

### 从模拟数据到 Supabase

原有系统使用了以下文件模拟数据：
- `app/lib/context/AppContext.tsx` - 应用上下文
- `app/lib/services/dataService.ts` - 数据服务
- `app/lib/mockData.ts` - 模拟数据

迁移时需要：

1. 更新 `AppContext.tsx` 中的方法，使用新的服务代替 dataService
2. 每个原 dataService 方法对应一个新的 Supabase 服务方法

### 数据类型映射

| TypeScript 类型 | PostgreSQL 类型 |
|----------------|----------------|
| string         | VARCHAR, TEXT   |
| number         | INTEGER, DECIMAL|
| boolean        | BOOLEAN         |
| Date           | TIMESTAMP       |
| string[]       | TEXT[]          |
| Enum           | ENUM 类型       |

## 身份验证

Supabase 提供完整的身份验证系统：

```typescript
// 注册
const { data, error } = await supabase.auth.signUp({
  email: 'example@email.com',
  password: 'password'
});

// 登录
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'example@email.com',
  password: 'password'
});

// 登出
const { error } = await supabase.auth.signOut();
```

## 请求模式示例

### 获取数据

```typescript
// 获取所有电影
const { data, error } = await supabase
  .from('movies')
  .select('*');

// 按条件筛选
const { data, error } = await supabase
  .from('movies')
  .select('*')
  .eq('status', 'showing');
  
// 使用视图
const { data, error } = await supabase
  .from('vw_now_showing_movies')
  .select('*');
```

### 插入数据

```typescript
const { data, error } = await supabase
  .from('movies')
  .insert({
    title: 'New Movie',
    director: 'Director Name',
    // ...其他字段
  })
  .select();
```

### 更新数据

```typescript
const { data, error } = await supabase
  .from('movies')
  .update({ status: 'showing' })
  .eq('id', movieId)
  .select();
```

### 调用函数

```typescript
const { data, error } = await supabase
  .rpc('create_order', {
    p_user_id: userId,
    p_showtime_id: showtimeId,
    p_seat_ids: seatIds,
    p_ticket_type: ticketType
  });
```

## RLS 策略

Row Level Security (RLS) 限制了不同用户角色对数据的访问权限：

- **管理员** - 完全访问权限
- **工作人员** - 访问与工作相关的订单、场次等
- **观众** - 仅访问自己的订单和公开信息

## 数据同步

- 当使用 Supabase JS 客户端更新数据时，RLS 策略会自动应用
- 通过视图可以获取聚合和计算数据
- 存储过程确保业务逻辑的一致性

## 迁移注意事项

1. 先测试数据库结构和函数，再迁移现有数据
2. 在开发环境中彻底测试后再部署到生产环境
3. 使用 Supabase 提供的备份功能定期备份数据 