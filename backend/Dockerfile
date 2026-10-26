FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm config set fetch-timeout 300000 \
 && npm install --no-audit --no-fund
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push --skip-generate && node src/server.js"]