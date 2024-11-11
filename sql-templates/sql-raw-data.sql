---
select
	name,
	mv_%period%4.gamers,
	country,
	countryname,
	mv_%period%4.secs,
	devname
from mv_%period%4
join mv_%period%1 using(titleid)
join mv_%period%3 using(devid)
join mv_%period%2 using(countryid)
where mv_%period%4.gamers>0
