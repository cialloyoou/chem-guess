# Cloudflare Pages 快速部署指南

## 🎯 前端已支持独立运行

项目已实现前端独立运行模式，无需后端即可完成化学测试！

## 📦 快速部署到 Cloudflare Pages

### 方式一：通过 Cloudflare 图形界面（推荐）

1. **访问 Cloudflare**
   - 登录 https://dash.cloudflare.com/
   - 左侧选择 "Pages"

2. **创建项目**
   - 点击 "Create a project" → "Connect to Git"
   - 选择你的 Git 仓库

3. **配置构建**
   ```
   项目名称:    chemistry-guessr (可自定义)
   Root directory:    client
   Build command:     npm run build
   Build output:      dist
   Framework preset:  Vite (或自动检测)
   ```

4. **点击 Deploy** - 完成！

### 方式二：使用 Wrangler CLI

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录
wrangler login

# 构建项目
cd client
npm install
npm run build

# 部署
wrangler pages deploy dist --project-name=chemistry-guessr
```

## ⚙️ 环境变量（可选）

如需强制使用本地模式，在 Cloudflare Pages 环境变量中添加：

```
VITE_USE_LOCAL_CHEMISTRY = true
```

不设置时，系统会自动检测后端是否可用，不可用时自动切换本地模式。

## ✅ 部署后验证

访问你的 Pages 地址，打开浏览器控制台（F12），如看到：

```
[chemistry-local] Loaded 20 questions
[chemistry] Falling back to local mode (standalone).
```

说明本地模式已启用，所有测试功能正常可用！

## 🌐 自定义域名

在 Pages 项目设置中：
1. 选择 "Custom domains"
2. 添加你的域名（如 chem.example.com）
3. 按提示配置 DNS CNAME 记录
4. 等待生效

## 📚 更多文档

- `client/CLOUDFLARE_PAGES_DEPLOY.md` - 详细部署指南
- `FRONTEND_STANDALONE_GUIDE.md` - 前端独立模式技术文档
- `前端独立运行说明.md` - 中文功能说明

## 🎉 现在就部署吧！

前端已完全独立，部署到 Cloudflare Pages 即可使用！
