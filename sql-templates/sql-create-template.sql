-- recreate materialized views

drop materialized view if exists mv_%period%5;
drop materialized view if exists mv_%period%4;
drop materialized view if exists mv_%period%3;
drop materialized view if exists mv_%period%2;
drop materialized view if exists mv_%period%1;

-- titleids
create MATERIALIZED VIEW mv_%period%1 as SELECT 
	presence.titleid,
    count(DISTINCT presence.xuid) AS gamers,
	sum(secs::bigint)::bigint as secs,
    games.name
   FROM presence                           
     JOIN gamers USING (xuid)
     JOIN games USING (titleid)
  WHERE 
	presence.utime >= EXTRACT(epoch FROM date_trunc('%period%', now()-interval '1 %period%'))::integer 
	AND presence.utime < EXTRACT(epoch FROM date_trunc('%period%', now()))::integer 
	AND gamers.countryid IS NOT NULL 
	AND games.isgame                                                                                      
  GROUP BY presence.titleid, games.name
  order by (count(DISTINCT presence.xuid)) desc
 LIMIT 500;

-- countries
CREATE MATERIALIZED VIEW mv_%period%2 AS
 SELECT 
    count(DISTINCT presence.xuid) AS gamers,
	sum(presence.secs::bigint)::bigint as secs,
	gamers.countryid,
    countries.country,
    countries.name AS countryname
   FROM ((public.presence
     JOIN public.gamers USING (xuid))
     JOIN public.countries USING (countryid))
  WHERE 
	presence.utime >= (EXTRACT(epoch FROM date_trunc('%period%', now()-interval '1 %period%'))::integer) 
	AND presence.utime < (EXTRACT(epoch FROM date_trunc('%period%', now()))::integer) 
	AND (gamers.countryid IS NOT NULL)
  GROUP BY gamers.countryid, countries.country, countries.name
  ORDER BY (count(DISTINCT presence.xuid)) DESC
 LIMIT 15;

-- devices
create MATERIALIZED VIEW mv_%period%3 as
	select 
		count(distinct xuid) as gamers,
		count(distinct titleid) as games,
		sum(presence.secs::bigint)::bigint as secs,
		devid,
		devname
	from presence 
	join devices using(devid) 
	join mv_%period%1 using(titleid)
	join gamers using(xuid)
	join mv_%period%2 using(countryid)
	WHERE 
		presence.utime >= (EXTRACT(epoch FROM date_trunc('%period%', now()-interval '1 %period%'))::integer) 
		AND presence.utime < (EXTRACT(epoch FROM date_trunc('%period%', now()))::integer) 
		and devid is not null 
		and countryid is not null
	group by devid,devname;

-- this %period%
CREATE MATERIALIZED VIEW mv_%period%4 AS
SELECT 
    max(gamers) AS gamers,
    titleid,
	max(secs) as secs,
	countryid,
    devid
   FROM ( SELECT gamers.countryid,
            presence.titleid,
            devid,
            count(DISTINCT presence.xuid) AS gamers,
			sum(presence.secs::bigint)::bigint as secs
           FROM (((presence
             JOIN gamers USING (xuid))
             JOIN mv_%period%1 USING (titleid))
             JOIN mv_%period%2 USING (countryid))
             join mv_%period%3 using(devid)
          WHERE
            presence.utime >= (EXTRACT(epoch FROM date_trunc('%period%', now()-interval '1 %period%')))::integer
            AND presence.utime < (EXTRACT(epoch FROM date_trunc('%period%', now())))::integer
            and devid is not null
			and countryid is not null
          GROUP BY CUBE(gamers.countryid, presence.titleid, devid)
        UNION
         SELECT mv_%period%2.countryid,
            mv_%period%1.titleid,
            mv_%period%3.devid,
            0 as gamers,
			0 as secs
           FROM mv_%period%1,
            mv_%period%2,
            mv_%period%3
            ) tab
  GROUP BY countryid, titleid, devid;

-- previous %period%
CREATE MATERIALIZED VIEW mv_%period%5 AS
SELECT 
    max(gamers) AS gamers,
    titleid,
	max(secs) as secs,
	countryid,
    devid
   FROM ( SELECT gamers.countryid,
            presence.titleid,
            devid,
            count(DISTINCT presence.xuid) AS gamers,
			sum(presence.secs::bigint)::bigint as secs
           FROM (((presence
             JOIN gamers USING (xuid))
             JOIN mv_%period%1 USING (titleid))
             JOIN mv_%period%2 USING (countryid))
             join mv_%period%3 using(devid)
          WHERE
            presence.utime >= (EXTRACT(epoch FROM date_trunc('%period%', now()-interval '2 %period%s')))::integer
            AND presence.utime < (EXTRACT(epoch FROM date_trunc('%period%', now()-interval '1 %period%')))::integer
            and devid is not null
			and countryid is not null
          GROUP BY CUBE(gamers.countryid, presence.titleid, devid)
        UNION
         SELECT mv_%period%2.countryid,
            mv_%period%1.titleid,
            mv_%period%3.devid,
            0 as gamers,
			0 as secs
           FROM mv_%period%1,
            mv_%period%2,
            mv_%period%3
            ) tab
  GROUP BY countryid, titleid, devid;

-- create indexes

create unique index if not exists mv_%period%1_unique_index on mv_%period%1(titleid);
create unique index if not exists mv_%period%2_unique_index on mv_%period%2(countryid );
create unique index if not exists mv_%period%3_unique_index on mv_%period%3(devid );
create unique index if not exists mv_%period%4_unique_index on mv_%period%4(devid,countryid,titleid);
create unique index if not exists mv_%period%5_unique_index on mv_%period%5(devid,countryid,titleid);

grant select on mv_%period%1 to readonly;
grant select on mv_%period%2 to readonly;
grant select on mv_%period%3 to readonly;
grant select on mv_%period%4 to readonly;
grant select on mv_%period%5 to readonly;


