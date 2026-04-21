FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig*.json nest-cli.json ./
COPY libs/ ./libs/
COPY apps/blind-vault/ ./apps/blind-vault/
RUN npm ci --ignore-scripts
RUN npm run build:blind-vault

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist/apps/blind-vault ./dist
COPY --from=builder /app/node_modules ./node_modules
ENV NODE_ENV=production
USER node
CMD ["node", "dist/src/main.js"]
