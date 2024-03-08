#! /bin/sh

timestamp=$(date "+%Y-%m-%d")
rm $(pwd)/static/melete_sql_dump_*.gz
docker exec melete-db-1 pg_dump -d postgresql://postgres:password@localhost:5432/postgres -Fc | gzip > $(pwd)/static/melete_sql_dump_"$timestamp".gz