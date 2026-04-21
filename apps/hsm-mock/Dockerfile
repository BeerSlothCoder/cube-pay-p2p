FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig*.json nest-cli.json ./
COPY libs/ ./libs/
COPY apps/hsm-mock/ ./apps/hsm-mock/
RUN npm ci --ignore-scripts
RUN npm run build:hsm-mock

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist/apps/hsm-mock ./dist
COPY --from=builder /app/node_modules ./node_modules
ENV NODE_ENV=development
USER node
CMD ["node", "dist/src/main.js"]
