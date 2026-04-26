FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npx prisma generate
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx tsx src/index.ts"]
