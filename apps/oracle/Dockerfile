FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig*.json nest-cli.json ./
COPY libs/ ./libs/
COPY apps/oracle/ ./apps/oracle/
RUN npm ci --ignore-scripts
RUN npm run build:oracle

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist/apps/oracle ./dist
COPY --from=builder /app/node_modules ./node_modules
ENV NODE_ENV=production
USER node
CMD ["node", "dist/src/main.js"]
