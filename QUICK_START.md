# 🚀 快速开始 - 化学物质猜测游戏

## 最快启动方式（5分钟）

### 步骤 1: 安装依赖

```bash
# 进入后端目录
cd server
npm install

# 进入前端目录
cd ../client
npm install
```

### 步骤 2: 配置环境变量

在 `server/` 目录下创建 `.env` 文件（或使用 `.env.example`）：

```env
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/chemistry
PORT=3000
```

**注意**：如果没有 MongoDB，可以暂时注释掉 `server/server.js` 中的 MongoDB 相关代码，化学游戏不依赖数据库。

### 步骤 3: 启动服务

**终端 1 - 启动后端：**
```bash
cd server
npm run dev
```

你应该看到：
```
Server is running on port 3000
Successfully loaded 20 chemistry questions
```

**终端 2 - 启动前端：**
```bash
cd client
npm run dev
```

你应该看到：
```
VITE v6.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### 步骤 4: 开始游戏

1. 打开浏览器访问：`http://localhost:5173`
2. 点击 **"🧪 猜化学物质"** 按钮
3. 看到初始提示（例如："固体 晶体"）
4. 在搜索框输入化学式或名称：
   - 输入 "硫酸" 或 "H2SO4"
   - 选择一个物质进行猜测
5. 查看反馈颜色：
   - 🟢 绿色 = 正确
   - 🟡 黄色 = 部分正确
   - ⚪ 灰色 = 错误

## 🧪 测试 API（可选）

在新终端中测试后端 API：

```bash
# 测试获取随机题目
curl http://localhost:3000/api/chemistry/random

# 测试搜索
curl "http://localhost:3000/api/chemistry/search?q=硫酸"

# 测试猜测
curl -X POST http://localhost:3000/api/chemistry/guess \
  -H "Content-Type: application/json" \
  -d '{"guessFormula":"H2SO4","answerFormula":"Na2SO4"}'
```

## 📝 示例游戏流程

1. **初始提示**：`固体 晶体`
2. **第一次猜测**：输入 "NaCl"（氯化钠）
   - 酸碱性：中性 ✅
   - 水解/电解：不能水解 / 能电解 ✅
   - 状态：固体 晶体 ✅
   - 反应：部分匹配 🟡
   - 其他：错误 ❌
3. **第二次猜测**：根据反馈调整...
4. **继续猜测**：直到猜对或用完 10 次机会

## 🎯 题库中的物质（20个）

可以尝试猜测这些物质：

- **酸类**：HCl（盐酸）、H2SO4（硫酸）、CH3COOH（乙酸）
- **碱类**：NaOH（氢氧化钠）、NH3（氨气）、Ca(OH)2（氢氧化钙）
- **盐类**：Na2SO4（硫酸钠）、NaCl（氯化钠）、CaCO3（碳酸钙）、CuSO4（硫酸铜）、AgNO3（硝酸银）、NH4Cl（氯化铵）、FeCl3（氯化铁）、KMnO4（高锰酸钾）
- **氧化物**：Fe2O3（氧化铁）、Al2O3（氧化铝）
- **气体**：CO2（二氧化碳）、Cl2（氯气）、SO2（二氧化硫）
- **其他**：H2O2（过氧化氢）

## 🔧 常见问题

### Q: MongoDB 连接失败怎么办？

A: 化学游戏不需要 MongoDB。如果看到 MongoDB 错误，可以忽略，或者：

1. 注释掉 `server/server.js` 中的这行：
   ```javascript
   // db.connect().catch(console.error);
   ```

2. 或者安装并启动 MongoDB：
   ```bash
   # macOS
   brew install mongodb-community
   brew services start mongodb-community
   
   # Windows
   # 下载并安装 MongoDB Community Server
   ```

### Q: 端口被占用怎么办？

A: 修改 `.env` 文件中的端口号：
```env
PORT=3001  # 改为其他端口
```

### Q: 前端无法连接后端？

A: 检查 `client/.env` 或 `client/vite.config.js` 中的 `VITE_SERVER_URL` 是否正确：
```env
VITE_SERVER_URL=http://localhost:3000
```

### Q: 如何添加新的化学物质？

A: 编辑 `server/data/chemistry_questions.json`，添加新条目后重启后端服务。

## 📚 下一步

- 阅读完整文档：[CHEMISTRY_GAME_README.md](./CHEMISTRY_GAME_README.md)
- 添加更多化学物质到题库
- 自定义游戏规则（修改 `ChemistrySinglePlayer.jsx`）
- 部署到生产环境（使用 Docker）

## 🎉 享受游戏！

如果一切正常，你现在应该可以：
- ✅ 看到主页的化学游戏按钮
- ✅ 进入游戏看到初始提示
- ✅ 搜索并选择化学物质
- ✅ 看到彩色反馈
- ✅ 完成一局游戏

祝你玩得开心！🧪✨

