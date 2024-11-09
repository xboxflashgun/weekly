<?php

header('Content-type: text/tsv');
header("Cache-control: private; max-age=300");

foreach ($_GET as $k => $v)
    if(preg_match('/[^0-9a-z_-]/', $k) || preg_match('/[^,0-9A-Za-z \/=-]/', $v))
        die("Oops: $k, $v");

# don't be bothered with the password here: it's only for local connections, no remote
$db = pg_connect("port=6432 host=/tmp dbname=global user=readonly password=masha27uk")
	or die("could not connect to DB");

$rep = "";

$tab = $_GET["tab"];
$num = $_GET["num"];

$dev = "true";
if(isset($_GET["devids"]))
	$dev = "devid=any(array[" . $_GET["devids"] . "])";

$req = "";

if($num ==  4 || $num == 5) {
	
	$req = "select titleid,countryid,sum(gamers),sum(secs) from mv_$tab$num where $dev group by 1,2 order by 1,2";

} else if($num == 6)

	$req="
with tab as materialized (
	select 
		titleid,
		string_agg(devid::text,',') as devs 
	from mv_${tab}4 
	where 
		$dev
		and devid is not null 
		and gamers > 0 
		and countryid is null 
	group by 1
) select
	titleid,
	devs,
	string_agg(genreid::text,',') as genreids 
from tab 
left join gamegenres using(titleid)
group by 1,2
";

else if($num == 7)
	$req = "
select
	distinct genreid,
	genre,
	sum(gamers) as gamers,
	count(distinct titleid) as games,
	sum(secs) as secs
from mv_${tab}4
join gamegenres using(titleid)
join genres using(genreid)
where
	$dev
	and countryid is null
	and devid is not null
group by 1,2

";
else
	$req = "select * from mv_$tab$num";

echo implode(pg_copy_to($db, "( $req )", chr(9)));

?>
