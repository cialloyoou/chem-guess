[中文](README.md) | [English](README.en.md)

## 📖 简介
chem-guess 是一个面向学习与练习的化学测试与资料库应用。

- 以化学物质为核心，支持按化学式或中文名称进行搜索与猜测
- 多维度反馈：酸碱性、水解/电解、状态、常见反应、其他性质
- 支持本地快速运行与 Docker 一键部署
- 目标场景：备考练习、课堂互动、小测验与自测

## 📦 运行教程

### 1. 本地 npm 运行

分别在 `client` 和 `server` 目录下执行：
```bash
npm install
npm run dev
```

### 2. Docker 运行

在根目录下新建 `.env`：
```env
DOMAIN_NAME=http://[你的 IP]
MONGODB_URI=mongodb://mongo:27017/chem-guess
CLIENT_INTERNAL_PORT=80
SERVER_INTERNAL_PORT=3000
NGINX_EXTERNAL_PORT=80
AES_SECRET=YourSuperSecretKeyChangeMe
SERVER_URL=http://[你的 IP]:3000
```

使用 `docker-compose`：
```bash
docker-compose up --build
# 关闭容器
docker-compose down
```

## 🧪 测试玩法

- 猜一个“化学物质”（可输入化学式或中文名称）
- 每次提交后，根据多个属性返回颜色反馈
- 绿色 = 完全匹配；黄色 = 部分匹配；灰色 = 不匹配
- 统一反应描述格式："与 X 反应生成 Y"

## ✨ 贡献题库/数据

- 题库 JSON：`server/data/chemistry_questions.json`
- 提交 PR 时保持字段与术语一致，示例与规范见 `CHEMISTRY_GAME_README.md`
- 资源放置路径：`client/public/assets`
- 若需扩展数据结构，请同步更新文档
