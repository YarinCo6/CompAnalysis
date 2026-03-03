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

# Install dependencies
RUN npm install 2>&1 && echo "=== npm install OK ==="

# Install Chromium + system deps
RUN npx playwright install --with-deps chromium 2>&1 && echo "=== playwright OK ==="

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate 2>&1 && echo "=== prisma generate OK ==="

# Build Next.js (separate step for clearer error messages)
RUN npm run build 2>&1 && echo "=== next build OK ==="

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --skip-generate && npm start"]
