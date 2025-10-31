[中文](README.md) | [English](README.en.md)

## 📖 Overview
chem-guess is a chemistry quiz and reference app for learning and practice.

- Guess/search chemical substances by formula or Chinese name
- Multi-attribute feedback: acid/base, hydrolysis/electrolysis, state, common reactions, other properties
- Fast local dev and one-command Docker deployment
- Use cases: practice, classroom activities, small quizzes and self‑tests

## 📦 How to Run

### 1) Local with npm

In both the `client` and `server` directories:
```bash
npm install
npm run dev
```

### 2) Docker

Create an `.env` in project root:
```env
DOMAIN_NAME=http://[your IP]
MONGODB_URI=mongodb://mongo:27017/chem-guess
CLIENT_INTERNAL_PORT=80
SERVER_INTERNAL_PORT=3000
NGINX_EXTERNAL_PORT=80
AES_SECRET=YourSuperSecretKeyChangeMe
SERVER_URL=http://[your IP]:3000
```

Then:
```bash
docker-compose up --build
# tear down
docker-compose down
```

## 🧪 How it works

- Guess a chemical substance (formula or name)
- After each submission you get per‑attribute feedback
- Green = correct, Yellow = partial, Gray = wrong
- Reaction text follows: "与 X 反应生成 Y" (consistent phrasing)

## ✨ Contributing questions/data

- Main JSON: `server/data/chemistry_questions.json`
- Keep field names and terms consistent; see `CHEMISTRY_GAME_README.md`
- Place assets under `client/public/assets`
- If you extend the schema, update docs accordingly
