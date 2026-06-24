# Deps Stage
FROM node:20-alpine AS deps
WORKDIR /app
# Install build dependencies and chromium runtime libraries
RUN apk add --no-cache \
    python3 make g++ \
    chromium chromium-swiftshader \
    nss freetype harfbuzz ca-certificates ttf-dejavu
COPY package*.json ./
RUN npm ci
RUN npx playwright install chromium

# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runtime Stage
FROM node:20-alpine AS production
# Install runtime dependencies for chromium and xvfb (virtual display)
RUN apk add --no-cache \
    dumb-init \
    chromium chromium-swiftshader \
    glib libx11 libxkbcommon libxrandr libxinerama libxtst \
    freetype fontconfig xdg-utils \
    nss ca-certificates ttf-dejavu \
    xvfb
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 & export DISPLAY=:99 && node dist/bootstrap/main.js"]