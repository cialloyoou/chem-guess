# 🚀 快速部署指南 (Quick Start)

> 5分钟快速部署化学物质猜测测试项目

---

## 📋 部署前准备清单

- [ ] GitHub 账号
- [ ] Railway 账号（推荐）或 Render/Vercel 账号
- [ ] 腾讯文档账号（用于在线题库，可选）
- [ ] 项目代码已推送到 GitHub

---

## 🎯 方案一：Railway 一键部署（推荐）

### 步骤 1：部署后端

1. **登录 Railway**
   - 访问 https://railway.app/
   - 使用 GitHub 账号登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的仓库

3. **配置后端服务**
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **添加环境变量**
   
   点击 "Variables" 标签，添加以下变量：
   
   ```bash
   PORT=3000
   CLIENT_URL=https://your-frontend-url.vercel.app
   SERVER_URL=https://your-backend-url.railway.app
   LEADERBOARD_STORAGE=file
   ADMIN_API_KEY=<生成一个随机密钥>
   ```
   
   **生成密钥命令**（在本地终端运行）：
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **配置持久化存储**
   - 点击 "Volumes" 标签
   - 添加新 Volume
   - **Mount Path**: `/app/data`
   - 保存

6. **部署**
   - 点击 "Deploy"
   - 等待部署完成
   - 记录后端 URL（如 `https://your-app.railway.app`）

---

### 步骤 2：部署前端

**选项 A：使用 Vercel（推荐）**

1. **登录 Vercel**
   - 访问 https://vercel.com/
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "New Project"
   - 选择你的 GitHub 仓库
   - 点击 "Import"

3. **配置构建设置**
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **添加环境变量**
   
   在 "Environment Variables" 部分添加：
   
   ```bash
   VITE_SERVER_URL=https://your-backend-url.railway.app
   VITE_SOCKET_URL=https://your-backend-url.railway.app
   VITE_AES_SECRET=<生成一个随机密钥>
   ```
   
   **生成密钥命令**：
   ```bash
   node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
   ```

5. **部署**
   - 点击 "Deploy"
   - 等待部署完成
   - 记录前端 URL（如 `https://your-app.vercel.app`）

---

### 步骤 3：更新 CORS 配置

1. 回到 Railway 后端项目
2. 更新环境变量 `CLIENT_URL` 为前端实际 URL
3. 保存并重新部署

---

### 步骤 4：配置在线题库（可选）

#### 使用腾讯文档

1. **创建在线表格**
   - 访问 https://docs.qq.com/
   - 创建新的在线表格

2. **设置表格结构**
   
   第一行为表头：
   ```
   化学式 | 名称 | 酸碱性 | 水解/电解 | 状态 | 反应 | 其他性质
   ```
   
   示例数据：
   ```
   H2SO4 | 硫酸 | 强酸 | 水解 | 液体 | 与金属反应/与碱反应 | 吸水性/脱水性
   NaCl | 氯化钠 | 中性 | 电解 | 固体 | 与硝酸银反应 | 易溶于水
   ```

3. **发布为 CSV**
   - 点击右上角"分享"
   - 选择"发布到网络"
   - 选择"CSV 格式"
   - 复制公开链接

4. **配置后端环境变量**
   
   在 Railway 后端项目中添加：
   ```bash
   CHEM_CSV_URL=<你的腾讯文档CSV链接>
   ```

5. **刷新题库**
   
   访问以下端点刷新题库：
   ```bash
   curl -X POST https://your-backend-url.railway.app/api/admin/refresh-questions \
     -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
   ```

---

## ✅ 验证部署

### 1. 检查后端健康状态

访问：`https://your-backend-url.railway.app/health`

应该返回：
```json
{
  "status": "ok",
  "mongodb": "connected" // 如果使用 MongoDB
}
```

### 2. 检查前端

访问：`https://your-app.vercel.app`

应该能看到：
- 首页正常显示
- 可以点击"开始测试"
- 排行榜显示正常

### 3. 测试游戏功能

- 开始一局游戏
- 输入化学式进行猜测
- 检查倒计时是否正常
- 完成游戏后检查排行榜是否更新

---

## 🔧 常见问题

### 问题 1：前端无法连接后端

**症状**：控制台显示 CORS 错误

**解决**：
1. 检查后端 `CLIENT_URL` 环境变量是否正确
2. 确保前端 `VITE_SERVER_URL` 指向正确的后端地址
3. 检查协议（http/https）是否匹配

### 问题 2：题库加载失败

**症状**：游戏无法开始，提示"无可用题目"

**解决**：
1. 检查 `CHEM_CSV_URL` 是否可访问
2. 手动访问刷新端点：`/api/admin/refresh-questions`
3. 查看后端日志确认题库解析是否成功

### 问题 3：排行榜数据丢失

**症状**：重启后排行榜清空

**解决**：
1. 确认 Railway 已配置 Volume（持久化存储）
2. 检查 Volume Mount Path 是否为 `/app/data`
3. 考虑迁移到 MongoDB（更可靠）

### 问题 4：Socket.IO 连接失败

**症状**：实时功能不工作

**解决**：
1. 检查 `VITE_SOCKET_URL` 是否正确
2. 确保后端支持 WebSocket（Railway 默认支持）
3. 检查防火墙设置

---

## 📊 部署后优化建议

### 1. 配置自定义域名

**Railway**:
- Settings → Domains → Add Custom Domain

**Vercel**:
- Settings → Domains → Add Domain

### 2. 启用 HTTPS（自动）

Railway 和 Vercel 都会自动配置 HTTPS，无需手动操作。

### 3. 配置 MongoDB（可选，适合大规模）

1. 创建 MongoDB Atlas 免费集群
   - 访问 https://www.mongodb.com/cloud/atlas
   - 创建免费 M0 集群
   - 获取连接字符串

2. 更新后端环境变量：
   ```bash
   LEADERBOARD_STORAGE=mongodb
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chemistry-guessr
   DB_NAME=chemistry-guessr
   ```

### 4. 配置 GitHub Actions 自动部署（可选）

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
      - name: Deploy to Railway
        run: echo "Railway 会自动部署"
```

---

## 📞 获取帮助

- 详细部署文档：[DEPLOYMENT.md](./DEPLOYMENT.md)
- 需求追踪日志：[REQUIREMENTS_LOG.md](./REQUIREMENTS_LOG.md)
- 项目 README：[README.md](./README.md)

---

## 🎉 部署完成！

恭喜！你的化学物质猜测测试项目已成功部署。

**下一步**：
1. 分享你的应用链接给用户
2. 定期更新题库（通过腾讯文档）
3. 监控应用性能和错误日志
4. 根据用户反馈持续优化

---

**最后更新**: 2025-10-28

