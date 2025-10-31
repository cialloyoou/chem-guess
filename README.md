[中文](README.md) | [English](README.en.md)

## 📖 简介
二次元笑传之猜猜呗，快来弗/灯一把吧！

- 一个猜动漫角色的游戏, 建议使用桌面端浏览器游玩。
- 灵感来源 [BLAST.tv](https://blast.tv/counter-strikle), 数据来源 [Bangumi](https://bgm.tv/)。
- 游玩群：467740403
- 开发交流群：894333602

## 📦 运行 / 部署

### ✅ 仅部署前端（Cloudflare Pages / Netlify / Vercel 等）
前端已经支持“独立模式”，无需后端即可完成化学测试。
1. 进入 `client` 目录：
   ```bash
   cd client
   npm install
   npm run build
   ```
2. 将 `client/dist` 目录直接部署到任意静态托管平台
3. 后端不可用时前端会自动切换到本地题库

> 详细步骤请参考 `client/CLOUDFLARE_PAGES_DEPLOY.md` 或根目录 `CLOUDFLARE部署指南.md`

### 🖥️ 本地开发模式
分别在 `client` 和 `server` 目录运行：
```bash
npm install
npm run dev
```

### 🐳 Docker 一键启动
新建 `.env` 文件（参考 `.env.example`），然后运行：
```bash
docker-compose up --build
```
停止并删除容器：
```bash
docker-compose down
```

## 🎮 游戏玩法

- 猜一个神秘动漫角色。搜索角色，然后做出猜测。
- 每次猜测后，你会获得你猜的角色的信息。
- 绿色高亮：正确或非常接近；黄色高亮：有点接近。
- "↑"：应该往高了猜；"↓"：应该往低了猜

## ✨ 贡献标签

- 提交外部标签PR的时候请注意！
- 素材文件分好文件夹，放到client/public/assets下。
- 标签数据可以直接放到client/public/data/extra_tags下，作者会看一下再导入。
- 本地测试新标签加载不出来？看一看有没有把条目ID放进./client/data的extra_tag_subjects.js里。
