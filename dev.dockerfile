FROM node:lts-alpine as build
WORKDIR /build
COPY . .
RUN npm ci
RUN npm run compile

FROM node:lts-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY --from=build /build/dist ./dist
COPY --from=build /build/prisma ./prisma
COPY --from=build /build/tsconfig.json ./
# generate frontend client for prisma
RUN ./node_modules/.bin/prisma generate
EXPOSE 8080
CMD [ "node", "dist/server/index.js" ]