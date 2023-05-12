FROM node:lts-alpine
WORKDIR /app
COPY . .

# install dependencies
RUN npm ci

# compile app
RUN npm run compile

# copy compiled code
COPY ./dist ./dist/

# generate frontend client for prisma for data proxy
RUN ./node_modules/.bin/prisma generate --data-proxy
EXPOSE 8080
CMD [ "node", "dist/server/index.js" ]