FROM node:20-alpine



COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src
COPY prisma.config.ts ./

RUN npx prisma generate

RUN npx tsc

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]