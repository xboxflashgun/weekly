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

$req = "";

if($num >=  4) {
	
	$dev = "";
	if(isset($_GET["devids"]))
		$dev = "where devid=any(array[" . $_GET["devids"] . "])";

	$req = "select titleid,countryid,sum(gamers),sum(secs) from mv_$tab$num $dev group by 1,2 order by 1,2";

} else
	$req = "select * from mv_$tab$num";

echo implode(pg_copy_to($db, "( $req )", chr(9)));

?>
