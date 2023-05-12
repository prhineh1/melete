# melete

Melete is an api that allows you to query data related to philosophy that has been scraped from Wikipedia.
API documentation and demos available at https://meleteapi.dev

## Getting Started

- install [docker](https://www.docker.com/products/docker-desktop/) for your platform
- clone or fork the repo
- start docker and run `docker compose up`

## Scripts

- build the dockerfile `docker build -t melete-api -f dev.dockerfile .`
- start the web crawler in a container:
  ````
  docker run \
  --mount type=bind,source="$(pwd)"/src/generated,target=/app/src/generated \
  --mount type=bind,source="$(pwd)"/prisma/seeds,target=/app/prisma/seeds \
  melete-api npm run crawl
  ````
    - The web crawler is multi-threaded, so you may want to consider increasing the number of CPUs Docker has access to
- `npx primsa migrate dev` creates the database and applies migrations
- `npx prisma db seed` seeds the database with the content in `prisma/seeds`
