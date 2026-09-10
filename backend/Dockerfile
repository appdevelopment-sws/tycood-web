# Production Dockerfile (Multi-stage build)

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci || npm install

COPY . .
RUN npm run build

# Stage 2: Production Dependencies stage
FROM node:20-alpine AS prod-deps

WORKDIR /usr/src/app

COPY package*.json ./
RUN (npm ci --only=production || npm install --only=production) && npm cache clean --force

# Stage 3: Runner stage
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy node_modules from prod-deps stage
COPY --from=prod-deps /usr/src/app/node_modules ./node_modules

# Copy compiled code from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Use non-root node user for enhanced security
USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]
