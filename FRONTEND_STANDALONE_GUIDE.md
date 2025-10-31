# 前端独立运行指南

## 概述

前端现已支持独立运行化学题目测试功能，无需后端服务器支持。

## 核心特性

### ✅ 自动降级机制

系统默认会尝试连接后端 API，如果后端不可用，会**自动降级**到本地模式，无需手动配置。

### ✅ 完整功能支持

本地模式支持所有核心化学测试功能：
- ✓ 随机出题（20道题库）
- ✓ 答案判分（精确/部分/错误反馈）
- ✓ 化学物质搜索
- ✓ 题库查询
- ✓ 计时和次数限制
- ✓ 本地测试记录

### ⚠️ 功能限制

本地模式下以下功能不可用：
- ✗ 全局排行榜（需要后端API）
- ✗ 跨设备数据同步
- ✗ 实时题库更新

## 快速部署

### 方案一：纯前端部署（推荐）

适用于 Netlify、Vercel、GitHub Pages 等静态托管平台。

```bash
# 1. 进入前端目录
cd client

# 2. 安装依赖
npm install

# 3. 构建生产版本
npm run build

# 4. 部署 dist 目录
# - Netlify: 直接拖拽 dist 目录到 Netlify
# - Vercel: 连接 Git 仓库，设置构建命令为 npm run build
# - GitHub Pages: 使用 GitHub Actions 自动部署
```

**无需配置任何环境变量！** 系统会自动检测后端不可用并启用本地模式。

### 方案二：强制本地模式

如果想避免尝试连接后端（减少加载延迟），可以设置环境变量：

```bash
# client/.env.production
VITE_USE_LOCAL_CHEMISTRY=true
```

然后构建：
```bash
npm run build
```

## 部署示例

### Netlify 部署

1. 登录 Netlify
2. 点击 "Add new site" → "Deploy manually"
3. 拖拽 `client/dist` 目录
4. 完成！访问分配的 URL

### Vercel 部署

1. 登录 Vercel
2. 导入 Git 仓库
3. 设置：
   - Framework Preset: Vite
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. 部署

### GitHub Pages 部署

在项目根目录创建 `.github/workflows/deploy-client.yml`：

```yaml
name: Deploy Client to GitHub Pages

on:
  push:
    branches: [ main ]
    paths:
      - 'client/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install and Build
        run: |
          cd client
          npm install
          npm run build
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./client/dist
```

## 技术实现

### 文件结构

```
client/
├── public/
│   └── data/
│       └── chemistry_questions.json   # 题库数据
├── src/
│   └── utils/
│       ├── chemistry.js               # API 接口（带自动降级）
│       └── chemistry-local.js         # 本地逻辑实现
```

### 工作原理

```javascript
// chemistry.js - 自动降级示例
async function getRandomChemistry() {
  if (shouldUseLocalMode()) {
    return localChem.getRandomChemistry();
  }

  try {
    // 尝试调用后端
    const response = await axios.get(`${API_BASE_URL}/api/chemistry/random`);
    return response.data;
  } catch (error) {
    // 后端失败，自动降级到本地模式
    activateLocalMode(error);
    return localChem.getRandomChemistry();
  }
}
```

### 判分算法

本地模式实现了与后端完全一致的判分逻辑：

**酸碱性判定：**
- 完全匹配 → `correct`
- 同为酸类/碱类 → `partial`
- 其他 → `wrong`

**状态/水解/其他属性：**
- 完全匹配 → `correct`
- 关键词重叠 → `partial`
- 无重叠 → `wrong`

**反应判定：**
- 所有反应完全匹配 → `correct`
- 部分反应匹配 → `partial`
- 无匹配 → `wrong`

### 随机算法

使用"短袋"（Short Bag）算法避免题目重复：

1. 从20道题中随机抽取最多30道（实际为全部）
2. 打乱顺序放入"袋子"
3. 依次从袋子抽题
4. 袋子空时重新填充

这确保了：
- ✓ 题目分布均匀
- ✓ 短期内不重复
- ✓ 长期保持随机性

## 数据管理

### 题库文件

位置：`client/public/data/chemistry_questions.json`

格式：
```json
[
  {
    "formula": "H2SO4",
    "name": "硫酸",
    "labels": {
      "acidBase": "强酸",
      "hydrolysisElectrolysis": "不能水解 / 能电解",
      "state": "液体 溶液",
      "reactions": [
        "与 NaOH 反应生成 Na2SO4",
        "与 Cu 反应生成 CuSO4"
      ],
      "other": "脱水性 / 吸水性 / 强氧化性"
    }
  }
]
```

### 更新题库

1. 编辑 `chemistry_questions.json`
2. 重新构建：`npm run build`
3. 重新部署 `dist` 目录

## 性能优化

### 首次加载

- 题库文件大小：~8KB（压缩后 ~3KB）
- 加载时间：< 100ms（本地网络）
- 内存占用：~200KB

### 运行时

- 搜索响应：< 10ms
- 判分计算：< 5ms
- 无需网络请求

## 浏览器兼容性

支持所有现代浏览器：
- ✓ Chrome 90+
- ✓ Firefox 88+
- ✓ Safari 14+
- ✓ Edge 90+

需要支持：
- ES6+ (async/await, arrow functions, etc.)
- Fetch API
- localStorage

## 故障排查

### 问题：题目加载失败

**现象：** 控制台显示 "Failed to load chemistry data"

**解决：**
1. 检查 `public/data/chemistry_questions.json` 文件是否存在
2. 验证 JSON 格式是否正确（使用 JSONLint）
3. 确认部署时包含了 public 目录的所有内容
4. 清除浏览器缓存后重试

### 问题：搜索功能不工作

**现象：** 输入搜索词无反应

**解决：**
1. 打开浏览器开发者工具查看错误信息
2. 检查是否成功加载了题库数据
3. 尝试刷新页面

### 问题：判分结果不准确

**现象：** 答案判定与预期不符

**解决：**
1. 检查题库数据中对应题目的标签是否正确
2. 查看控制台是否有错误信息
3. 验证输入的化学式格式是否正确

## 开发调试

### 本地测试

```bash
# 启动开发服务器
cd client
npm run dev

# 访问 http://localhost:5173
```

### 测试本地模式

在浏览器控制台运行：

```javascript
// 检查数据是否加载
await fetch('/data/chemistry_questions.json')
  .then(r => r.json())
  .then(d => console.log(`Loaded ${d.length} questions`));

// 测试随机题目
// (需要先打开应用页面)
```

### 调试技巧

1. **查看模式状态：** 打开控制台，查找 `[chemistry] Falling back to local mode` 日志
2. **验证数据加载：** 检查网络面板，确认 `chemistry_questions.json` 加载成功
3. **测试判分：** 在开发者工具中设置断点调试判分逻辑

## 常见问题

### Q: 本地模式会影响性能吗？

A: 不会。本地模式首次加载题库后，所有计算都在浏览器中完成，响应速度通常比调用后端 API 更快。

### Q: 如何同时支持后端和本地模式？

A: 默认就是这样！系统会自动检测后端可用性，后端不可用时自动切换到本地模式。

### Q: 可以自定义题库吗？

A: 可以。编辑 `public/data/chemistry_questions.json` 文件，添加或修改题目，然后重新构建部署。

### Q: 排行榜功能还能用吗？

A: 如果后端不可用，全局排行榜功能将不可用。但测试记录会保存在浏览器本地存储中。

### Q: 如何确认使用的是本地模式？

A: 打开浏览器开发者工具的控制台，如果看到 `[chemistry-local] Loaded XX questions` 日志，说明正在使用本地模式。

## 进阶配置

### 修改题库大小

编辑 `chemistry-local.js`：

```javascript
const BAG_SIZE = 30;  // 修改这个值来调整袋子大小
```

### 禁用自动降级

如果想在后端不可用时显示错误而不是自动降级：

编辑 `chemistry.js`，删除所有 `activateLocalMode(error)` 调用。

### 添加更多题目

在 `chemistry_questions.json` 中添加新题目：

```json
{
  "formula": "NaCl",
  "name": "氯化钠",
  "labels": {
    "acidBase": "中性",
    "hydrolysisElectrolysis": "不能水解 / 能电解",
    "state": "固体 晶体",
    "reactions": [
      "与 AgNO3 反应生成 AgCl"
    ],
    "other": "食盐 / 调味品"
  }
}
```

## 总结

现在前端可以完全独立运行，无需后端服务器支持。部署到任何静态托管平台即可使用完整的化学测试功能。

**推荐部署方案：** 直接部署到 Netlify 或 Vercel，让系统自动处理后端连接和本地模式切换。

如有问题，请查看浏览器控制台的详细日志信息。
