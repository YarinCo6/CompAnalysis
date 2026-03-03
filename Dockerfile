FROM node:20-slim

WORKDIR /app

# Default env vars (override at runtime via HF Space / Render settings)
ENV DATABASE_URL=file:/tmp/prod.db
ENV NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=default-change-me-in-production
ENV NODE_ENV=production
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Copy package files
COPY package*.json ./

# Install dependencies (skip Playwright browser download during npm install)
RUN npm install

# Install Chromium + all its system deps via Playwright
RUN npx playwright install --with-deps chromium

# Copy source
COPY . .

# Generate Prisma client and build Next.js
RUN npx prisma generate && npm run build

EXPOSE 3000

# Startup: init DB then start server
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm start"]
