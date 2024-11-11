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

	fetch("api/gettitle.php?t=" + id)
	.then(res => res.text())
	.then(res => {

		var row = res.split('\t');

		if(row[1])	{

			var [ link, released, developer, publisher, category, categories, optimized, compatible, attrs ] = [ 
				row[0],
				new Date(row[1]),
				row[2],
				row[3],
				row[4],
				row[5].split('|'),			// categories
				row[6].split('|'),			// optimized
				row[7].split('|'),			// compatible
				JSON.parse(row[8]),			// attributes
			];

			var imgs = {};

			row[9].split('|').forEach( r => {

				var row = r.split(':');
				imgs[row[0]] = row[1];

			});

			var img;

			img ??= imgs.BoxArt;
			img ??= imgs.Logo;
			img ??= imgs.logo;
			img ??= imgs.Poster;
			img ??= imgs.BrandedKeyArt;

		}

		if( ! img )
			img = 'https://store-images.s-microsoft.com/image/apps.52902.70775362622833233.2297d754-dc3e-47c7-bef3-00c95ef0ef65.c7b5eb4b-0f1a-44ba-bc1d-11617c9a5ee2?mode=scale';
		else if( img.substring(0, 4) !== 'http')
			img = 'https:' + img;
	
		img = img.replace('http://images-eds', 'https://images-eds-ssl');
		img += (img.indexOf('?') < 0) ? '?' : '&';
		img += 'w=64';

		popup.select('img').attr('src', img);

		if(compatible)
			link = "https://www.xbox.com/games/store/name/" + link;
		else
			link = "https://apps.microsoft.com/detail/" + link;

		d3.select("#imglink").attr("href", link ?? "")
		.style('pointer-events', link ? null : "none");

		d3.select("#genres").selectAll("span")
		.data(devgenres[id].genreids)
		.join(enter => {
				enter.append('span').text(g => genres[g].genre);
			}, update => {
				update.text(g => genres[g].genre);
			}, exit => exit.remove()
		);

		d3.select("#cellplats").selectAll("span")
		.data(devgenres[id].devids)
		.join(enter => {
			enter.append('span').text(p => devices[p].devname);
		}, update => {
			update.text(p => devices[p].devname);
		}, exit => exit.remove()
		);

		d3.select("#celldevel").text(developer);
		d3.select("#cellpublisher").text(publisher);

		return;

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

	window_drag(popup);

}
