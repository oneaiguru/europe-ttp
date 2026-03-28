FROM node:20.20.0-slim

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

EXPOSE 3000

ENV NODE_ENV=development
ENV HOSTNAME=0.0.0.0

CMD ["npx", "next", "dev", "--hostname", "0.0.0.0"]
