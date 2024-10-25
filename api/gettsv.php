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

if(preg_match('/^(week\d+)$/', $_GET['tab'], $matches))
	$tab = $matches[1];
else
	die("Oops");

echo implode(pg_copy_to($db, "( select * from $tab )", chr(9)));

?>
