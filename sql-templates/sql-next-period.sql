-- %period%ly refresh
set work_mem='16GB';

begin;

	refresh materialized view concurrently mv_%period%1;
	refresh materialized view concurrently mv_%period%2;
	refresh materialized view concurrently mv_%period%3;
	refresh materialized view concurrently mv_%period%4;
	refresh materialized view concurrently mv_%period%5;

	insert into mv_periods(ts1,ts2,ts3,period) values(
		date_trunc('%period%', now()-interval '2 %period%s'),
		date_trunc('%period%', now()-interval '1 %period%'),
		date_trunc('%period%', now()),
		'%period%')
	on conflict(period) do update set
		ts1=date_trunc('%period%', now()-interval '2 %period%s'),
		ts2=date_trunc('%period%', now()-interval '1 %period%'),
		ts3=date_trunc('%period%', now());

commit;


