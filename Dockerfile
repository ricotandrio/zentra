# =========================
# Base image
# =========================
FROM node:22-bookworm-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxrender1 \
    libxshmfence1 \
    libxtst6 \
    wget \
    gnupg \
    xvfb \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

# Playwright browsers
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx playwright install chromium

COPY . .
RUN npm run build


# =========================
# Production image
# =========================
FROM node:22-bookworm-slim AS production

WORKDIR /app

RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxrender1 \
    libxshmfence1 \
    libxtst6 \
    xvfb \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# create user FIRST (important fix)
RUN useradd -m nodeuser

# copy app
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /ms-playwright /ms-playwright

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV DISPLAY=:99

# create data folder AFTER user exists
RUN mkdir -p /app/data && chown -R nodeuser:nodeuser /app

USER nodeuser

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]

CMD ["sh", "-c", "Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 & export DISPLAY=:99 && exec node dist/bootstrap/main.js"]