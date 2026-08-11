# MergeMind API — riverstone container
# Build: TS -> dist, then run with node (production deps only)
FROM node:20-alpine AS build
WORKDIR /app

# Install all deps (dev deps needed for tsc)
COPY package.json ./
RUN npm install

# Compile
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Runtime stage ---
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Production deps only
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Compiled app
COPY --from=build /app/dist ./dist

# License key store dir (persisted via compose volume)
RUN mkdir -p /data

EXPOSE 3000
CMD ["node", "dist/app.js"]
