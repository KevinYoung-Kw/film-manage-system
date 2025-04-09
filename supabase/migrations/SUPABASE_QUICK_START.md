# 电影票务系统 Supabase 快速入门指南

本指南将帮助您快速设置电影票务系统与Supabase的集成，使系统能够优先从Supabase获取数据，只有在获取失败时才会使用本地静态数据。

## 先决条件

1. 已安装Node.js和npm
2. 已创建Supabase账户和项目

## 第一步：复制环境变量

1. 在项目根目录找到 `.env` 文件
2. 复制该文件并重命名为 `.env.local`
3. 在 `.env.local` 文件中填入您的Supabase URL和匿名API密钥:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 第二步：迁移数据库结构

按以下顺序在Supabase SQL编辑器中执行SQL脚本：

1. `SQL_DESIGN_SCHEMA.sql` - 创建表结构
2. `SQL_PROCEDURES.sql` - 创建存储过程
3. `SQL_TRIGGERS.sql` - 创建触发器
4. `SQL_VIEWS.sql` - 创建视图
5. `SQL_SECURITY.sql` - 设置行级安全策略
6. `SQL_DATA_MIGRATION.sql` - 导入初始数据

## 第三步：安装依赖并启动应用

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 查看应用程序。

## 数据流程说明

该系统使用了回退机制，确保始终能够提供数据：

1. 当尝试获取数据时，系统会首先连接到Supabase数据库
2. 如果成功连接并获取数据，将使用Supabase中的数据
3. 如果连接失败或获取数据出错，系统会自动回退使用本地静态数据
4. 这种机制确保了即使在没有网络连接的情况下，应用也能正常运行

## 文件结构

关键文件说明：

- `app/lib/services/supabaseClient.ts` - Supabase客户端配置
- `app/lib/services/fallbackService.ts` - 回退服务，处理Supabase与本地数据的切换
- `app/lib/services/dataService.ts` - 主数据服务，调用回退服务
- `app/lib/types/database.types.ts` - Supabase数据库类型定义

## 故障排除

如果您在连接Supabase时遇到问题，请检查：

1. 确保`.env.local`文件中的URL和API密钥正确无误
2. 检查Supabase项目的CORS设置是否允许您的应用域
3. 确认数据库表结构已正确创建
4. 查看浏览器控制台是否有错误信息

## 切换到纯本地模式

如果您想完全使用本地数据模式（不连接Supabase），可以：

1. 在`.env.local`中删除或注释掉Supabase配置
2. 重启应用程序

应用将自动切换到使用本地静态数据。 