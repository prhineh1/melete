FROM node:lts-alpine as build
WORKDIR /build
COPY . .
RUN npm ci
RUN npm run compile

FROM node:lts-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /build/dist ./dist
COPY --from=build /build/prisma ./prisma
RUN ./node_modules/.bin/prisma generate --data-proxy
EXPOSE 8080
CMD [ "node", "dist/server/index.js" ]