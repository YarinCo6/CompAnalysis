FROM node:20-slim

WORKDIR /app

# Default env vars (override at runtime via HF Space / Render settings)
ENV DATABASE_URL=file:/tmp/prod.db
ENV NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=default-change-me-in-production
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDeps needed for build: tailwind, prisma, typescript)
RUN npm install

# Install Chromium + system deps
RUN npx playwright install --with-deps chromium

# Copy source
COPY . .

# Generate Prisma client and build Next.js
ENV NODE_ENV=production
RUN npx prisma generate && npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --skip-generate && npm start"]
