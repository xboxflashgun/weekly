///
function cellinfo(e) {

	var td = e.target.closest('TD');
	var col = td.cellIndex;

	if(col < 1)
		return;

	var id = d3.select(td.parentNode).select('td').node().dataset.id;

	var popup = d3.select("#cellinfo");
	popup.select("h1").text(titleids[id].name);
	popup.select("h2").text(countries[colsorted[col-1]].countryname);


	var link;
	var imgs;
	var genres;

	fetch("api/gettitle.php?t=" + id)
	.then(res => res.text())
	.then(res => {

		res.split('\n').forEach(s => {

			if(s.length === 0)
				return;

			var row = s.split('\t');
			link = row[0];
			genres = row[1].split('|');
			imgs = JSON.parse(row[2])[0];

		});

		console.log(link, genres, imgs);

	});

}
