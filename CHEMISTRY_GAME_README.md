# chem-guess - 项目文档

## 📖 项目简介

chem-guess 是一个面向学习与练习的化学测试与资料库应用。采用 React + Node.js + Express + MongoDB 架构，围绕化学式、酸碱性、水解/电解、物态、常见反应、其他性质等维度提供猜测练习与对比反馈。

## 🎮 游戏玩法

1. 系统随机选择一个化学物质作为答案
2. 玩家看到初始提示（物质的状态：固体/液体/气体）
3. 玩家输入化学式或中文名称进行猜测
4. 系统返回各项属性的匹配反馈：
   - **酸碱性**：强酸/弱酸/强碱/弱碱/中性/两性
   - **水解/电解**：能水解/不能水解/能电解/不能电解
   - **状态**：固体 晶体/液体 溶液/气体
   - **反应**：与其他物质的反应（数组）
   - **其他性质**：颜色、用途、特性等
5. 反馈颜色：
   - 🟢 **绿色** = 完全正确
   - 🟡 **黄色** = 部分正确
   - ⚪ **灰色** = 错误
6. 玩家有 10 次猜测机会

## 📁 项目结构

```
chem-guess/
├── client/                          # 前端 (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChemistrySearchBar.jsx      # 化学物质搜索组件
│   │   │   ├── ChemistryGuessesTable.jsx   # 猜测历史表格组件
│   │   │   └── ...                         # 其他原有组件
│   │   ├── pages/
│   │   │   ├── ChemistrySinglePlayer.jsx   # 化学游戏单人模式页面
│   │   │   ├── Home.jsx                    # 主页（已更新）
│   │   │   └── ...                         # 原有页面
│   │   ├── utils/
│   │   │   ├── chemistry.js                # 化学游戏工具函数
│   │   │   └── ...                         # 原有工具
│   │   └── styles/
│   │       ├── SearchBar.css               # 搜索栏样式
│   │       └── ...                         # 其他样式
│   └── ...
├── server/                          # 后端 (Node.js + Express)
│   ├── data/
│   │   └── chemistry_questions.json        # 化学题库 (20个示例)
│   ├── seed/
│   │   └── chemistry_seed.js               # 题库加载和比对逻辑
│   ├── server.js                           # 主服务器文件（已添加化学API）
│   └── ...
└── ...
```

## 🗂️ 题库格式

### JSON 结构

题库文件：`server/data/chemistry_questions.json`

```json
[
  {
    "formula": "Na2SO4",
    "name": "硫酸钠",
    "labels": {
      "acidBase": "中性",
      "hydrolysisElectrolysis": "不能水解 / 能电解",
      "state": "固体 晶体",
      "reactions": [
        "与 Ba2+ 反应生成 BaSO4",
        "与热浓 H2SO4 反应生成 SO3"
      ],
      "other": "可溶于水 / 工业用途 / 脱水剂"
    }
  }
]
```

### 字段说明

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `formula` | String | 化学式 | "H2SO4" |
| `name` | String | 中文名称 | "硫酸" |
| `labels.acidBase` | String | 酸碱性 | "强酸" / "弱碱性" / "中性" / "两性" |
| `labels.hydrolysisElectrolysis` | String | 水解/电解性质 | "能水解 / 能电解" |
| `labels.state` | String | 物质状态 | "固体 晶体" / "液体 溶液" / "气体" |
| `labels.reactions` | Array | 反应列表 | ["与 NaOH 反应生成 Na2SO4"] |
| `labels.other` | String | 其他性质 | "脱水性 / 吸水性 / 强氧化性" |

### 反应格式规范

**重要**：所有反应必须严格遵循格式：**"与 X 反应生成 Y"**

- ✅ 正确：`"与 NaOH 反应生成 NaCl"`
- ✅ 正确：`"与 O2 反应生成 SO3"`
- ❌ 错误：`"和 NaOH 生成 NaCl"` （缺少"反应"）
- ❌ 错误：`"与 NaOH 反应得到 NaCl"` （应为"生成"）

## 🔌 API 接口

### 1. 获取随机题目

```http
GET /api/chemistry/random
```

**响应示例：**
```json
{
  "formula": "Na2SO4",
  "initialHint": "固体 晶体"
}
```

### 2. 提交猜测

```http
POST /api/chemistry/guess
Content-Type: application/json

{
  "guessFormula": "CaCO3",
  "answerFormula": "Na2SO4"
}
```

**响应示例：**
```json
{
  "formula": "Na2SO4",
  "name": "硫酸钠",
  "correctLabels": { ... },
  "guessLabels": { ... },
  "guessName": "碳酸钙",
  "feedback": {
    "acidBase": "wrong",
    "hydrolysisElectrolysis": "partial",
    "state": "correct",
    "reactions": ["wrong", "partial"],
    "reactionsOverall": "partial",
    "other": "wrong"
  },
  "isCorrect": false
}
```

### 3. 获取所有题目

```http
GET /api/chemistry/all
```

### 4. 搜索化学物质

```http
GET /api/chemistry/search?q=硫酸
```

## 🚀 运行教程

### 方式一：本地 npm 运行

#### 1. 安装依赖

```bash
# 后端
cd server
npm install

# 前端
cd ../client
npm install
```

#### 2. 配置环境变量

在 `server/` 目录下创建 `.env` 文件：

```env
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/chemistry
PORT=3000
```

#### 3. 启动服务

```bash
# 启动后端（在 server/ 目录）
npm run dev

# 启动前端（在 client/ 目录，新终端）
npm run dev
```

#### 4. 访问游戏

打开浏览器访问：`http://localhost:5173`

点击 **"🧪 猜化学物质"** 按钮开始游戏

### 方式二：Docker 运行

#### 1. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
DOMAIN_NAME=http://localhost
MONGODB_URI=mongodb://mongo:27017/chemistry
CLIENT_INTERNAL_PORT=80
SERVER_INTERNAL_PORT=3000
NGINX_EXTERNAL_PORT=80
AES_SECRET=YourSuperSecretKeyChangeMe
SERVER_URL=http://localhost:3000
```

#### 2. 启动容器

```bash
docker-compose up --build
```

#### 3. 访问游戏

打开浏览器访问：`http://localhost`

## 🧪 测试

### 测试后端 API

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

### 测试前端

1. 访问 `http://localhost:5173`
2. 点击 "🧪 猜化学物质"
3. 尝试搜索 "硫酸" 或直接输入 "H2SO4"
4. 查看反馈颜色是否正确

## 📝 添加新题目

编辑 `server/data/chemistry_questions.json`，添加新的化学物质条目：

```json
{
  "formula": "新化学式",
  "name": "新物质名称",
  "labels": {
    "acidBase": "酸碱性",
    "hydrolysisElectrolysis": "水解/电解性质",
    "state": "状态",
    "reactions": [
      "与 X 反应生成 Y"
    ],
    "other": "其他性质"
  }
}
```

重启服务器后新题目即可生效。

## 🎨 前端组件说明

### ChemistrySearchBar
- 支持化学式和中文名称搜索
- 实时搜索建议
- 键盘导航（上下箭头、Enter、Esc）
- 支持直接输入化学式

### ChemistryGuessesTable
- 显示猜测历史
- 颜色反馈（绿/黄/灰）
- 反应列表展开/收起
- 响应式设计

### ChemistrySinglePlayer
- 游戏主页面
- 显示初始提示和剩余次数
- 处理猜测逻辑
- 游戏结束判断

## 🔧 后端逻辑说明

### chemistry_seed.js

核心函数：

- `loadChemistryQuestions()` - 加载题库
- `getRandomQuestion()` - 获取随机题目
- `findQuestionByFormula()` - 根据化学式查找
- `compareLabelValue()` - 比较标签值（返回 correct/partial/wrong）
- `compareReactions()` - 比较反应数组
- `getOverallReactionFeedback()` - 获取反应整体反馈

## 📊 当前题库统计

- **总题目数**：20 个
- **包含物质类型**：
  - 酸：HCl, H2SO4, CH3COOH
  - 碱：NaOH, NH3, Ca(OH)2
  - 盐：Na2SO4, NaCl, CaCO3, CuSO4, AgNO3, NH4Cl, FeCl3, KMnO4
  - 氧化物：Fe2O3, Al2O3
  - 气体：CO2, Cl2, SO2
  - 其他：H2O2

## 📚 术语速览

- 酸碱性：强酸/弱酸/强碱/弱碱/中性/两性
- 水解/电解：能水解/不能水解；能电解/不能电解
- 状态：固体 晶体/液体 溶液/气体
- 反应：与 X 反应生成 Y（统一语句格式）
- 其他性质：颜色、用途、特性等

## 🤝 贡献指南

欢迎贡献新的化学物质题目！请确保：

1. 遵循 JSON 格式规范
2. 反应格式统一："与 X 反应生成 Y"
3. 标签术语一致（避免同义词）
4. 提供准确的化学信息

## 📄 许可证

遵循本仓库 LICENSE 文件的许可条款。

## 🙏 致谢

- 灵感来源：Wordle 类猜测游戏
- 数据来源：高中化学教材

---

**祝你游戏愉快！🧪✨**

