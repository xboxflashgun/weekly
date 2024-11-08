///
function cellinfo(e) {

	var td = e.target.closest('TD');
	var col = td.cellIndex;

	if(col < 1)
		return;

	var id = d3.select(td.parentNode).select('td').node().dataset.id;

	var popup = d3.select("#cellinfo");
	popup.select("h1").text(titleids[id].name);
	popup.select("h2").text('Country: ' + countries[colsorted[col-1]].countryname);

	popup.style("top", +e.layerY + 10 + "px");
	popup.style("left", +e.layerX - 5 + "px");

	popup.select('img').attr('src', "/1x1.png");
	popup.style("display", null);

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

		var img;

		if( imgs )
			imgs.forEach( i => {
				if( i.Purpose === 'BoxArt' && +i.Width >= 160)
					img = i.ResizeUrl;
				else if( i.ImagePurpose === 'BoxArt' )
					img = i.Uri;
			});

		if( ! img )
			img = 'https://store-images.s-microsoft.com/image/apps.52902.70775362622833233.2297d754-dc3e-47c7-bef3-00c95ef0ef65.c7b5eb4b-0f1a-44ba-bc1d-11617c9a5ee2?mode=scale';
		else if( img.substring(0, 4) !== 'http')
			img = 'https:' + img;
	
		img = img.replace('http://images-eds', 'https://images-eds-ssl');
		img += (img.indexOf('?') < 0) ? '?' : '&';
		img += 'w=64';

		popup.select('img').attr('src', img);

		if(genres) 
			d3.select("#genres").selectAll("span")
			.data(genres)
			.join(enter => {
					enter.append('span').text(g => g);
				}, update => {
					update.text(g => g);
				}, exit => exit.remove()
			);
		else
			d3.selectAll("#genres span").remove();

		d3.select("#cellplats").selectAll("span")
		.data(devgenres[id].devids)
		.join(enter => {
			enter.append('span').text(p => devices[p].devname);
		}, update => {
			update.text(p => devices[p].devname);
		}, exit => exit.remove()
		);

		var [ cell1, cell2 ] = [ gamers[id][colsorted[col-1]], prevper[id][colsorted[col-1]] ];

		//////////////////////
		// fill table cellinfo
		// sel = "t"/"p" (this/previous)
		function fill_tab(cell, sel) {

			Object.keys(cell).forEach( p => {
			
				if(p === "cell")
					return;
				Object.keys(cell[p]).forEach( k => {

					var t = compact(cell[p][k] * ((k === "perc")? 100 : 1)) + ((k === "perc") ? "%" : "");
					popup.select(`#${sel+p+k}`).text(t);

					// world
					t = compact( ((sel === "t") ? gamers["0"][colsorted[col-1]][p][k] : prevper["0"][colsorted[col-1]][p][k]) * ((k === "perc")? 100 : 1));
					t = t + ((k === "perc") ? "%" : "");
					popup.select(`#${sel+p+k}0`).text(t);

				});

			});

		}

		popup.selectAll(".cellinfocountry").text(countries[colsorted[col-1]].country);
		fill_tab(cell1, "t");
		fill_tab(cell2, "p");

	});

	popup.select(".winclose").on('click', e => popup.style("display", "none"));

}
