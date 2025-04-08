# 电影票务管理系统

基于Next.js开发的全功能电影票务管理系统，支持用户购票、工作人员售检票和管理员系统维护等功能。

## 主要功能

### 客户端功能

- 浏览电影信息
- 查看放映场次
- 选择座位
- 在线购票
- 查看订单记录
- 个人信息管理

### 工作人员功能

- 售票服务
- 检票验证
- 退票处理
- 操作记录查询
- 排班信息查看

### 管理员功能

- 电影管理
- 排片管理
- 影厅管理
- 员工管理
- 数据统计
- 票价设置
- 系统设置

## 项目架构

```
app/
  ├── components/       # 组件目录
  │   ├── layout/       # 布局组件
  │   └── ui/           # UI组件
  ├── lib/              # 工具和数据
  │   ├── context/      # 上下文
  │   ├── services/     # 服务层
  │   ├── types/        # 类型定义
  │   ├── hooks/        # 自定义钩子
  │   └── mockData.ts   # 模拟数据
  ├── user/             # 客户端页面
  ├── staff/            # 工作人员页面
  ├── admin/            # 管理员页面
  ├── login/            # 登录页面
  ├── register/         # 注册页面
  ├── globals.css       # 全局样式
  └── page.tsx          # 首页
```

## 技术栈

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Supabase (可选的后端服务)

## 数据模型

系统包含以下主要数据模型：

- **用户(User)**：包括管理员、售票员和观众
- **电影(Movie)**：电影基本信息
- **影厅(Theater)**：影院的放映厅信息
- **座位(Seat)**：影厅座位信息
- **场次(Showtime)**：电影排期场次
- **订单(Order)**：购票订单
- **操作记录(StaffOperation)**：员工操作历史记录
- **排班信息(StaffSchedule)**：员工工作排班表

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制`.env.local.example`文件为`.env.local`并填写相关配置信息。

### 开发模式

```bash
npm run dev
```

### 构建项目

```bash
npm run build
```

### 运行构建后的项目

```bash
npm start
```

## 部署到 Vercel

本项目可以轻松部署到 Vercel 平台，方法如下：

1. 将项目推送到 GitHub 仓库
2. 在 [Vercel](https://vercel.com/) 中导入 GitHub 仓库
3. 配置必要的环境变量（参考 `.env.local.example`）
4. 完成自动部署

更详细的部署说明请参考项目根目录中的 `deployment-guide.md` 文件。

## 演示账户

系统预设了以下测试账户（密码统一为：123456）：

- 管理员: admin@example.com
- 售票员: staff1@example.com
- 观众: customer1@example.com / customer2@example.com

## 接入Supabase

项目已准备好接入Supabase数据库的相关接口，按照以下步骤进行配置：

1. 在[Supabase](https://supabase.com/)创建项目
2. 在`.env.local`文件中配置Supabase URL和匿名密钥
3. 在Supabase项目中创建必要的数据表（参考`app/lib/types/index.ts`中的数据模型）

## 后续计划

1. 完善用户评分和评论功能
2. 添加会员系统和积分管理
3. 实现电影推荐功能
4. 优化移动端体验
5. 添加在线支付集成

## 许可证

MIT