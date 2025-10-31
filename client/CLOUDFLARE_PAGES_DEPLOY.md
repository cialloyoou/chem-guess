# Cloudflare Pages 部署指南

本指南帮助你将前端项目部署到 Cloudflare Pages。项目已经支持“前端独立模式”，无需后端即可完成化学题目测试。

## 1. 前提条件

- Git 仓库已包含 `client` 目录内的所有代码
- 修改均已推送到远程仓库（Cloudflare Pages 会拉取仓库内容）
- 拥有 Cloudflare 账号并登录

## 2. 一键部署：使用 Cloudflare Pages 图形界面

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/)，选择左侧导航的 **Pages**。
2. 点击 **Create a project** → **Connect to Git**。
3. 授权 Cloudflare 访问你的 Git 提供商（GitHub/GitLab/Bitbucket）。
4. 选择包含此项目的仓库。
5. 配置构建设置：
   - **Project name**：可自定义，例如 `chemistry-guessr`
   - **Production branch**：选择你想部署的分支（例如 `main` 或当前开发分支）
   - **Framework preset**：选择 `Vite`（Cloudflare 会自动填充常规配置）
   - **Build command**：`npm run build`
   - **Build output directory**：`dist`
   - **Root directory**：`client`
6. 点击 **Save and Deploy**。Cloudflare 将自动安装依赖、构建并部署应用。

部署完成后，Pages 会提供一个形如 `https://<project>.pages.dev` 的访问地址。

## 3. （可选）设置环境变量

本项目默认会尝试连接后端；若后端不可达，将自动降级到本地题库。如果你希望部署后固定使用本地模式，可以在 Pages 的 **Environment variables** 中添加：

| 名称                     | 值     | 说明                                   |
|-------------------------|--------|----------------------------------------|
| `VITE_USE_LOCAL_CHEMISTRY` | `true` | 强制使用前端自带的数据与判分逻辑       |

## 4. 自定义域名（可选）

1. 在 Pages 项目的 **Custom domains** 页签中点击 **Set up a custom domain**。
2. 录入你的自定义域（例如 `chem.mydomain.com`）。
3. 按提示在 DNS 中添加 `CNAME` 记录指向 `your-project.pages.dev`。
4. 等待 DNS 生效即可使用自定义域名访问。

## 5. 通过 Wrangler CLI 部署（高级用法）

你也可以使用 Cloudflare 的 [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) 进行部署：

```bash
# 1. 安装 wrangler（若未安装）
npm install -g wrangler

# 2. 登录 Cloudflare 账号
wrangler login

# 3. 切换到 client 目录并部署预览
cd client
wrangler pages deploy dist --branch=preview --project-name=chemistry-guessr

# 4. 部署生产环境
wrangler pages publish dist --project-name=chemistry-guessr
```

若使用 CLI，请先在本地构建：

```bash
cd client
npm install
npm run build
```

## 6. 验证部署

部署完成后，访问你的 Pages 地址。打开浏览器控制台，如看到以下日志，说明已自动切换到本地模式：

```
[chemistry-local] Loaded 20 questions
[chemistry] Falling back to local mode (standalone).
```

此时即可直接进行化学测试，所有题目检索、判分功能均在纯前端完成，无需后端服务。

如需更多详细信息，请查看根目录下的：
- `FRONTEND_STANDALONE_GUIDE.md`
- `前端独立运行说明.md`

祝部署顺利！🎉
