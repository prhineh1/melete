# melete

Melete is an api that allows you to query data related to philosophy that has been scraped from Wikipedia.
API documentation and demos available at https://meleteapi.dev

## Getting Started

- install [docker](https://www.docker.com/products/docker-desktop/) for your platform
- clone or fork the repo
- start docker and run `docker compose up`

## Scripts
You can run the following scripts in docker using [docker exec](https://docs.docker.com/engine/reference/commandline/exec/).

- `npm run crawl` starts the web-crawler which generates seed files for the database
  - The web crawler is multi-threaded, increasing the number of CPUs Docker has access to will speed up the crawl
- `npx primsa migrate deploy` creates the database and applies migrations
- `npx prisma db seed` seeds the database with the content in `prisma/seeds`
- `npm run watch` starts the typescript compiler in watch mode. Any .ts file under src will be compiled
