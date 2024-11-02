#!/bin/bash

cd $(dirname $0)

sed -e "s/%period%/$1/g" sql-next-period.sql > /tmp/next.$$.sql
psql -Xq global -f /tmp/next.$$.sql
rm /tmp/next.$$.sql

