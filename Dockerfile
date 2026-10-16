FROM node:22-slim AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

EXPOSE 3000
ENV NODE_ENV=production PORT=3000 DATABASE_URL="file:/data/dev.db"
VOLUME /data
RUN mkdir -p /data
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm start"]
