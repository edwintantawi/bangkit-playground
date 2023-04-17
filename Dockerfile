FROM node:18.15.0-alpine3.17

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm ci

COPY index.js ./

CMD ["node", "index.js"]