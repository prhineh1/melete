FROM node:lts-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run compile
CMD [ "node", "dist/api/index.js" ]