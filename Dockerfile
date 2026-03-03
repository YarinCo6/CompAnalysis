FROM node:20-slim

WORKDIR /app

# Install Playwright system deps + Chromium only (much smaller than full Playwright image)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 \
      libatk1.0-0 libcups2 libdbus-1-3 libdrm2 libgbm1 libgtk-3-0 \
      libnspr4 libnss3 libx11-xcb1 libxcomposite1 libxdamage1 \
      libxrandr2 xdg-utils libxshmfence1 libglu1-mesa libpango-1.0-0 \
      libcairo2 && \
    rm -rf /var/lib/apt/lists/*

# Default env vars (override at runtime via HF Space / Render settings)
ENV DATABASE_URL=file:/tmp/prod.db
ENV NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=default-change-me-in-production
ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/app/.cache/ms-playwright

# Copy package files
COPY package*.json ./

# Install dependencies (skip browser download, we install separately)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm install

# Install only Chromium browser for Playwright
RUN npx playwright install chromium

# Copy source
COPY . .

# Generate Prisma client and build Next.js
RUN npx prisma generate && npm run build

EXPOSE 3000

# Startup: init DB then start server
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm start"]
