FROM node:lts-alpine as build
WORKDIR /build
COPY . .
RUN npm ci
RUN npm run compile

FROM node:lts-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY static ./static/
COPY prisma ./prisma/
RUN npm ci --omit=dev
COPY --from=build /build/dist ./dist
RUN ./node_modules/.bin/prisma generate
EXPOSE 8080
CMD [ "node", "dist/server/index.js" ]