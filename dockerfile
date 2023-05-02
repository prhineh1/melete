FROM node:lts-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run compile