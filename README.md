---
title: BJJ Scout
emoji: 🥋
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 3000
pinned: false
---

# BJJ Scout

Private intelligence app for BJJ & Grappling competitors.

## Local Development

```bash
cp .env.local.example .env.local
# Edit .env.local with your credentials
npm install
npx playwright install chromium
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)
