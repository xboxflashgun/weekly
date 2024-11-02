# Materialized view templates

## Create materialized views

	```
	sed 's/%period%/day/g' sql-create-template.sql | psql global
	```

## Refreshing materialized views

	```
	next-period.sh day
	```

'day' can be 'week', 'month', 'year' (in case you have enough data)


