-- %period%ly refresh
set work_mem='16GB';

begin;

	refresh materialized view concurrently mv_%period%1;
	refresh materialized view concurrently mv_%period%2;
	refresh materialized view concurrently mv_%period%3;
	refresh materialized view concurrently mv_%period%4;
	refresh materialized view concurrently mv_%period%5;

	with accur as (
	    with tab2 as (
	        with tab as (
	            select 
		            distinct utime 
		            from presence 
		            where utime>extract(epoch from now()-interval'1 %period%')::int 
		            order by utime
	        ) 
	    select 
	        utime,
	        utime-lag(utime) over () as hole from tab as hole
	    ) select
	   	    date_trunc('%period%', now()-interval '2 %period%s') as ts1,
		    date_trunc('%period%', now()-interval '1 %period%') as ts2,
		    date_trunc('%period%', now()) as ts3,
		    '%period%' as period,
	        sum(hole)/extract(epoch from interval '1 %period%') as accuracy 
	    from tab2 
	    where hole>60
	    group by ts1,ts2,ts3,period
	    union 
	    select
	   	    date_trunc('%period%', now()-interval '2 %period%s') as ts1,
		    date_trunc('%period%', now()-interval '1 %period%') as ts2,
		    date_trunc('%period%', now()) as ts3,
		    '%period%' as period,
	        0 as accuracy 
	    from tab2 
	) insert into mv_periods(ts1,ts2,ts3,period,accuracy) (
		select 
			ts1,ts2,ts3,period,max(accuracy)
		from accur
		group by ts1,ts2,ts3,period
	) on conflict(period) do update set
		        ts1=date_trunc('%period%', now()-interval '2 %period%s'),
		        ts2=date_trunc('%period%', now()-interval '1 %period%'),
		        ts3=date_trunc('%period%', now()),
		        accuracy=EXCLUDED.accuracy;

	insert into mv_periods(period,gamers4,hours4) 
		select 
			'%period%' as period,
			gamers as gamers4,
			secs/3600./gamers  as hours4 
		from mv_%period%4 
		where 
			titleid is null 
			and countryid is null 
			and devid is null
	on conflict(period) do update 
		set gamers4=EXCLUDED.gamers4,
		hours4=EXCLUDED.hours4;

	insert into mv_periods(period,gamers5,hours5) 
		select 
			'%period%' as period,
			gamers as gamers5,
			secs/3600./gamers  as hours5 
		from mv_%period%5
		where 
			titleid is null 
			and countryid is null 
			and devid is null
	on conflict(period) do update 
		set gamers5=EXCLUDED.gamers5,
		hours5=EXCLUDED.hours5;

commit;


