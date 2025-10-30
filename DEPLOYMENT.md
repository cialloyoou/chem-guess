# 🚀 部署指南 (Deployment Guide)

本文档提供化学物质猜测测试项目的完整部署指南。

---

## 📋 目录

1. [部署前准备](#部署前准备)
2. [方案一：Railway 部署（推荐）](#方案一railway-部署推荐)
3. [方案二：Render 部署](#方案二render-部署)
4. [方案三：Vercel 部署](#方案三vercel-部署)
5. [在线题库配置](#在线题库配置)
6. [数据持久化配置](#数据持久化配置)
7. [故障排查](#故障排查)

---

## 部署前准备

### 1. 环境要求

- Node.js 18+ 
- npm 或 yarn
- Git

### 2. 配置环境变量

#### 后端环境变量 (`server/.env`)

复制 `server/.env.example` 为 `server/.env`，并根据部署环境修改：

```bash
# 基础配置
PORT=3000
CLIENT_URL=https://your-frontend-domain.com
SERVER_URL=https://your-backend-domain.com

# 题库配置（可选，使用在线文档）
CHEM_CSV_URL=https://docs.qq.com/sheet/xxxxx?export=csv

# 排行榜存储（小规模使用 file，大规模使用 mongodb）
LEADERBOARD_STORAGE=file

# 管理员密钥（用于刷新题库）
ADMIN_API_KEY=your-random-secret-key
```

#### 前端环境变量 (`client/.env`)

复制 `client/.env.example` 为 `client/.env`：

```bash
# API 地址
VITE_SERVER_URL=https://your-backend-domain.com
VITE_SOCKET_URL=https://your-backend-domain.com

# 加密密钥
VITE_AES_SECRET=your-random-secret-key
```

### 3. 生成密钥

```bash
# 生成 ADMIN_API_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 生成 VITE_AES_SECRET
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## 方案一：Railway 部署（推荐）

### 优势
- ✅ 免费额度充足（每月 $5）
- ✅ 支持前后端一起部署
- ✅ 自动 HTTPS
- ✅ 支持文件持久化（Volume）
- ✅ GitHub 自动部署

### 部署步骤

#### 1. 准备 Railway 账号

1. 访问 [Railway.app](https://railway.app/)
2. 使用 GitHub 账号登录
3. 连接你的 GitHub 仓库

#### 2. 部署后端

1. 在 Railway 创建新项目
2. 选择 "Deploy from GitHub repo"
3. 选择你的仓库
4. 配置构建设置：
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. 添加环境变量（在 Variables 标签页）：
   ```
   PORT=3000
   CLIENT_URL=https://your-frontend-domain.com
   LEADERBOARD_STORAGE=file
   ADMIN_API_KEY=<生成的密钥>
   ```
6. 添加 Volume（持久化存储）：
   - Mount Path: `/app/data`
   - 用于存储 `leaderboard.json`

7. 部署完成后，记录后端 URL（如 `https://your-app.railway.app`）

#### 3. 部署前端

**方法 A：使用 Railway 部署静态站点**

1. 在同一项目中添加新服务
2. 配置构建设置：
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve -s dist -l 3000`
3. 添加环境变量：
   ```
   VITE_SERVER_URL=https://your-backend-url.railway.app
   VITE_SOCKET_URL=https://your-backend-url.railway.app
   VITE_AES_SECRET=<生成的密钥>
   ```

**方法 B：使用 Vercel/Netlify 部署前端**

1. 在 Vercel/Netlify 创建新项目
2. 连接 GitHub 仓库
3. 配置构建设置：
   - **Base Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. 添加环境变量（同上）

#### 4. 更新 CORS 配置

部署完成后，在后端环境变量中更新 `CLIENT_URL` 为前端实际域名。

---

## 方案二：Render 部署

### 优势
- ✅ 免费层可用
- ✅ 自动 HTTPS
- ✅ 简单易用

### 劣势
- ⚠️ 免费层 15 分钟无活动会休眠
- ⚠️ 冷启动较慢

### 部署步骤

#### 1. 部署后端

1. 访问 [Render.com](https://render.com/)
2. 创建新 Web Service
3. 连接 GitHub 仓库
4. 配置：
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. 添加环境变量（同 Railway）
6. 选择免费计划（Free）

#### 2. 部署前端

1. 创建新 Static Site
2. 配置：
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. 添加环境变量

---

## 方案三：Vercel 部署

### 适用场景
- 仅部署前端
- 后端需要改造为 Serverless Functions

### 前端部署步骤

1. 访问 [Vercel.com](https://vercel.com/)
2. 导入 GitHub 仓库
3. 配置：
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. 添加环境变量
5. 部署

### 后端改造（可选）

如需在 Vercel 部署后端，需要将 Express 改造为 Serverless Functions：

```javascript
// api/index.js
module.exports = (req, res) => {
  // Express app logic
};
```

---

## 在线题库配置

### 方案 A：腾讯文档 CSV（推荐）

#### 1. 准备题库文档

1. 在腾讯文档创建在线表格
2. 列结构：
   ```
   化学式 | 名称 | 酸碱性 | 水解/电解 | 状态 | 反应 | 其他性质
   ```
3. 示例数据：
   ```
   H2SO4 | 硫酸 | 强酸 | 水解 | 液体 | 与金属反应/与碱反应 | 吸水性/脱水性
   ```

#### 2. 发布为 CSV

1. 点击文档右上角"分享"
2. 选择"发布到网络"
3. 选择"CSV 格式"
4. 复制公开链接

#### 3. 配置环境变量

在后端环境变量中添加：

```bash
CHEM_CSV_URL=https://docs.qq.com/sheet/xxxxx?export=csv
```

#### 4. 刷新题库

访问管理端点刷新题库：

```bash
curl -X POST https://your-backend-url.com/api/admin/refresh-questions \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```

### 方案 B：Google Sheets

1. 创建 Google Sheets 文档
2. 发布为 CSV：文件 → 发布到网络 → CSV
3. 复制链接并配置 `CHEM_CSV_URL`

### 方案 C：本地 Excel 文件

1. 将 Excel 文件放在 `server/data/chemistry_questions.xlsx`
2. 配置环境变量：
   ```bash
   CHEM_XLSX_PATH=./data/chemistry_questions.xlsx
   ```

---

## 数据持久化配置

### 方案 A：文件存储（小规模）

**适用场景**：单实例部署，用户量 < 1000

**配置**：

```bash
LEADERBOARD_STORAGE=file
LEADERBOARD_FILE_PATH=./data/leaderboard.json
```

**注意**：需要配置持久化存储（Railway Volume / Render Disk）

### 方案 B：MongoDB（推荐，大规模）

**适用场景**：多实例部署，用户量 > 1000

**步骤**：

1. 创建 MongoDB Atlas 免费集群
   - 访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - 创建免费 M0 集群
   - 创建数据库用户
   - 获取连接字符串

2. 配置环境变量：
   ```bash
   LEADERBOARD_STORAGE=mongodb
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chem-guess
   DB_NAME=chem-guess
   ```

3. 更新 `server/utils/leaderboard.js` 支持 MongoDB（需要开发）

---

## 故障排查

### 问题 1：CORS 错误

**症状**：前端无法连接后端，控制台显示 CORS 错误

**解决**：
1. 检查后端 `CLIENT_URL` 环境变量是否正确
2. 确保前端域名在 CORS 白名单中
3. 检查协议（http/https）是否匹配

### 问题 2：Socket.IO 连接失败

**症状**：实时功能不工作

**解决**：
1. 检查 `VITE_SOCKET_URL` 是否正确
2. 确保后端支持 WebSocket
3. 检查防火墙/代理设置

### 问题 3：题库加载失败

**症状**：游戏无法开始，提示"无可用题目"

**解决**：
1. 检查 `CHEM_CSV_URL` 是否可访问
2. 查看后端日志，确认题库解析是否成功
3. 手动访问刷新端点：`/api/admin/refresh-questions`

### 问题 4：排行榜数据丢失

**症状**：重启后排行榜清空

**解决**：
1. 确认已配置持久化存储（Volume/Disk）
2. 检查 `LEADERBOARD_FILE_PATH` 路径是否正确
3. 考虑迁移到 MongoDB

### 问题 5：构建失败

**症状**：部署时构建报错

**解决**：
1. 检查 Node.js 版本（需要 18+）
2. 清除缓存：`rm -rf node_modules package-lock.json && npm install`
3. 检查依赖是否完整

---

## 📞 技术支持

如遇到其他问题，请：
1. 查看后端日志
2. 检查环境变量配置
3. 参考 [REQUIREMENTS_LOG.md](./REQUIREMENTS_LOG.md) 了解功能实现细节

---

## 🔄 持续部署

### GitHub Actions 自动部署（可选）

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Deploy to Railway
        run: |
          # Railway CLI 部署命令
```

---

**最后更新**: 2025-10-28

