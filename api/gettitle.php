<?php

header('Content-type: text/tsv');
header("Cache-control: private; max-age=300");

foreach ($_GET as $k => $v)
    if(preg_match('/[^0-9a-z_-]/', $k) || preg_match('/[^,0-9A-Za-z \/=-]/', $v))
        die("Oops: $k, $v");

# don't be bothered with the password here: it's only for local connections, no remote
$db = pg_connect("port=6432 host=/tmp dbname=dipa user=readonly password=masha27uk")
	or die("could not connect to DB");

$rep = "";

$t = $_GET["t"];

$req = "";

echo implode(pg_copy_to($db, "(

select 
	bigid,
	released,
	developer,
	publisher,
	category,
	array_to_string(categories,'|') as categories,
	array_to_string(optimized,'|') as optimized,
	array_to_string(compatible,'|') as compatible,
	attributes,
	string_agg(purpose || ':' || uri,'|') as images, 
	type
from products 
join images using(bigid) 
where titleid=$t
group by 1,2,3,4,5,6,7,8,9,11

)", chr(9)));

?>
