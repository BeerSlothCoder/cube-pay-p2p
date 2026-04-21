FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY libs/ ./libs/
COPY apps/api/ ./apps/api/
RUN npm ci --ignore-scripts
RUN npm run build:api

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist/apps/api ./dist
COPY --from=builder /app/node_modules ./node_modules
ENV NODE_ENV=production
USER node
CMD ["node", "dist/src/main.js"]
