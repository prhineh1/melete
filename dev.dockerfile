FROM node:lts-alpine
WORKDIR /app
COPY . .

# install dependencies
RUN npm ci

# compile app
RUN npm run compile

# copy compiled code
COPY ./dist ./dist/

# generate frontend client for prisma
RUN ./node_modules/.bin/prisma generate
EXPOSE 8080
CMD [ "node", "dist/server/index.js" ]