#!/bin/bash

cd $(dirname $0)

sed -e "s/%period%/$1/g" sql-next-period.sql > /tmp/next.$$.sql
psql -Xq global -f /tmp/next.$$.sql
rm /tmp/next.$$.sql

sed -e "s/%period%/$1/g" sql-raw-data.sql > /tmp/raw.$$.sql
psql --csv -Xf /tmp/raw.$$.sql global | bzip2 > /var/www/html/xboxstat.com.ta.$1.csv.bz2
rm /tmp/raw.$$.sql
