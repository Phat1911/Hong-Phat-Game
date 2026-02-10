FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
ENV NEXT_PUBLIC_API_URL=https://poetic-surprise-production-a81f.up.railway.app
ENV NEXT_PUBLIC_WS_URL=wss://poetic-surprise-production-a81f.up.railway.app

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN npm install -g serve

COPY --from=builder /app/out ./out

EXPOSE 3000

CMD ["sh", "-c", "serve -s out -l ${PORT:-3000}"]
