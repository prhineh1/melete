FROM postgres:15-alpine
# Create shadow db for prisma
COPY ./init.sql /docker-entrypoint-initdb.d/