FROM node:22-slim
WORKDIR /app

# OpenSSL est requis par le moteur Prisma, les CA par les requêtes sortantes (SMTP).
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production PORT=3000 DATABASE_URL="file:/data/dev.db"
VOLUME /data

# Le volume Railway (ou -v creneau-data:/data) est monté sur /data : la base y survit aux redéploiements.
RUN mkdir -p /data

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# db push (idempotent) crée les tables au premier boot, SEED_DEMO=1 remplit le compte de démo une seule fois.
# Railway injecte PORT : s'y brancher plutôt que sur 3000 en dur. exec + node direct = next reçoit SIGTERM.
CMD db="${DATABASE_URL#file:}"; \
    fresh=0; [ -f "$db" ] || fresh=1; \
    node node_modules/prisma/build/index.js db push --skip-generate && \
    if [ "$SEED_DEMO" = 1 ] && [ "$fresh" = 1 ]; then npm run seed; fi && \
    exec node node_modules/next/dist/bin/next start -p "${PORT:-3000}" -H 0.0.0.0
