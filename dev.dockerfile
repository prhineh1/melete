FROM node:lts-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run compile && ./node_modules/.bin/prisma generate
EXPOSE 8080
CMD [ "node", "dist/server/index.js" ]