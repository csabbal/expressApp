# ===========================
# Base Stage
# ===========================
FROM node:22-slim AS base
ENV APP_LOCATION=/usr/src/app
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
RUN mkdir -p ${APP_LOCATION}
WORKDIR ${APP_LOCATION}
COPY ./ ./
RUN npm install

# ===========================
# Testing Stage
# ===========================
FROM base AS testing
# Run lint and test:coverage scripts from package.json and show output
RUN npm run lint && npm run test:coverage -- --verbose

# ===========================
# Development Stage
# ===========================
FROM base AS development
# Install all dependencies (including dev dependencies)
RUN npm install
# Use a volume for the src folder
VOLUME ["${APP_LOCATION}"]
# Run both start:dev and run:dev commands
CMD ["sh", "-c", "npm run start:dev & npm run run:dev"]

# ===========================
# Production Stage
# ===========================
FROM base AS production
RUN npm run build
# Install PM2 globally for process management
RUN npm install -g pm2

# Start the application using PM2
CMD pm2-runtime start ecosystem.json --env production