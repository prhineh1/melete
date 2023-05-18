#! /bin/sh

timestamp=$(date "+%Y-%m-%d")
docker exec melete-db-1 pg_dump -d postgresql://postgres:password@localhost:5432/postgres -Fc -f /tmp/melete_sql_dump_"$timestamp".gz
rm $(pwd)/static/melete_sql_dump_*.gz
docker cp melete-db-1:/tmp/melete_sql_dump_"$timestamp".gz  $(pwd)/static/