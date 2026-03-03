FROM mcr.microsoft.com/playwright:v1.42.0-jammy

WORKDIR /app

# Install Node.js 20
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Default env vars (override at runtime via HF Space / Render settings)
ENV DATABASE_URL=file:/tmp/prod.db
ENV NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=default-change-me-in-production
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Generate Prisma client and build Next.js
RUN npx prisma generate && npm run build

EXPOSE 3000

# Startup: init DB then start server
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm start"]
