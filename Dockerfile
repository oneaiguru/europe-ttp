FROM node:20.20.0-slim

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

EXPOSE 8009

ENV NODE_ENV=development
ENV HOSTNAME=0.0.0.0
ENV PORT=8009

CMD ["npx", "next", "dev", "--hostname", "0.0.0.0", "--port", "8009"]
