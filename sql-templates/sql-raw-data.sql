---
select
	name,
	mv_%period%4.gamers,
	country,
	countryname,
	mv_%period%4.secs,
	devname
from mv_week4
join mv_week1 using(titleid)
join mv_week3 using(devid)
join mv_week2 using(countryid)
where mv_%period%4.gamers>0
