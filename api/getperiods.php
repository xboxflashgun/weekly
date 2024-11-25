<?php

header('Content-type: application/json');
header("Cache-control: private; max-age=300");

# don't be bothered with the password here: it's only for local connections, no remote
$db = pg_connect("port=6432 host=/tmp dbname=global user=readonly password=masha27uk")
	or die("could not connect to DB");

echo json_encode(pg_fetch_all(pg_query($db, "

	select * from mv_periods order by ts1

")), JSON_UNESCAPED_UNICODE);

?>
