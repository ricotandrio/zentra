# Deps Stage
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci
RUN npx playwright install --with-deps

# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runtime Stage
FROM node:20-alpine AS production
RUN apk add --no-cache dumb-init glib libx11 libxkbcommon libxrandr libxinerama libxtst freetype fontconfig xdg-utils
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/bootstrap/main.js"]