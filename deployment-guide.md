# 电影票务管理系统 Vercel 部署指南

本指南将指导您如何将电影票务管理系统部署到 Vercel 平台。

## 前期准备

1. 一个 [GitHub](https://github.com/) 账户
2. 一个 [Vercel](https://vercel.com/) 账户
3. 已完成的电影票务管理系统代码仓库

## 部署步骤

### 1. 创建/准备 GitHub 仓库

1. 登录 GitHub 账户
2. 创建新仓库或使用现有仓库
3. 将电影票务管理系统代码推送到仓库中：

```bash
git init
git add .
git commit -m "初始化电影票务管理系统"
git branch -M main
git remote add origin https://github.com/你的用户名/film-manage-system.git
git push -u origin main
```

### 2. 连接 Vercel 和 GitHub

1. 登录 [Vercel](https://vercel.com/)
2. 如果是首次使用，可能需要连接 GitHub 账户，按照提示操作进行授权

### 3. 导入项目

1. 在 Vercel 仪表板中，点击 "Add New..." > "Project"
2. 选择包含电影票务管理系统的 GitHub 仓库
3. 配置部署设置：
   - **Framework Preset**: 应自动检测为 Next.js
   - **Root Directory**: 如果代码在根目录，保持默认
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 4. 配置环境变量

在部署设置页面的 "Environment Variables" 部分，添加以下变量：

| 变量名 | 值 | 描述 |
|--------|----|----|
| NEXT_PUBLIC_SITE_URL | https://your-app.vercel.app | 你的应用URL (可在首次部署后更新) |
| NEXT_PUBLIC_SITE_NAME | 电影票务管理系统 | 站点名称 |

### 5. 部署项目

1. 点击 "Deploy" 按钮开始部署
2. Vercel 将自动构建和部署项目
3. 部署完成后，Vercel 将提供一个可访问的 URL

### 6. 自定义域名 (可选)

1. 进入 Vercel 项目设置
2. 选择 "Domains" 选项
3. 点击 "Add" 添加您的自定义域名
4. 按照 Vercel 提供的 DNS 设置说明操作

## 持续部署

Vercel 支持持续部署，当您推送新的代码到 GitHub 仓库时，Vercel 将自动重新构建和部署项目：

1. 在本地修改代码
2. 提交并推送到 GitHub
   ```bash
   git add .
   git commit -m "更新功能"
   git push
   ```
3. Vercel 将自动检测更改并重新部署

## 项目特殊配置文件

已为您准备了以下特殊配置文件以优化 Vercel 部署：

1. `vercel.json` - 包含 Vercel 特定的配置
2. `next.config.mjs` - 配置 Next.js 以适应 Vercel 部署
3. `.env.local.example` - 环境变量示例

## 故障排除

### 部署问题

- **构建失败**：检查构建日志，修复代码中的错误
- **运行时错误**：查看 Vercel 的函数日志和客户端控制台
- **环境变量问题**：确保所有必要的环境变量都已正确设置

### 性能优化

项目已经配置了以下优化：

- 图片优化通过 Next.js Image 组件
- 移除了 Turbopack 以确保稳定性
- 配置了适当的元数据和视口设置

## 资源链接

- [Vercel 文档](https://vercel.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [项目 GitHub 仓库](https://github.com/你的用户名/film-manage-system) 