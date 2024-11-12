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

	var p = [];		// promises

	p.push(fetch("api/gettitle.php?t=" + id)
	.then(res => res.text())
	.then(res => {

		if(res.length === 0)		// not a xbox one/series titlei
			return;

		var row = res.split('\t');

		var [ link, released, developer, publisher, category, categories, optimized, compatible, attrs ] = [ 
			row[0],
			new Date(row[1]),
			row[2],
			row[3],
			row[4],
			row[5] ? row[5].split('|') : [''],			// categories
			row[6] ? row[6].split('|') : [''],			// optimized
			row[7] ? row[7].split('|') : [''],			// compatible
			row[8] ? JSON.parse(row[8]) : {},			// attributes
		];

		var imgs = {};

		if(row[9]) 
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

		if( ! img )
			img = 'https://store-images.s-microsoft.com/image/apps.52902.70775362622833233.2297d754-dc3e-47c7-bef3-00c95ef0ef65.c7b5eb4b-0f1a-44ba-bc1d-11617c9a5ee2?mode=scale';
		else if( img.substring(0, 4) !== 'http')
			img = 'https:' + img;
	
		img = img.replace('http://images-eds', 'https://images-eds-ssl');
		img += (img.indexOf('?') < 0) ? '?' : '&';
		img += 'w=64';

		popup.select('img').attr('src', img);

		if(compatible)
			link = `https://www.xbox.com/${langs[colsorted[col-1]].path}/games/store/name/${link}`;
		else
			link = "https://apps.microsoft.com/detail/" + link;

		d3.select("#imglink").attr("href", link ?? "")
		.style('pointer-events', link ? null : "none");

		d3.select("#celldevel").text(developer);
		d3.select("#cellpublisher").text(publisher);
		d3.select("#cellreleased").text(released ? released.toLocaleDateString() : '');

	}));

	p.push(fetch("api/gett360.php?t=" + id)
	.then(res => res.text())
	.then(res => {

		if(res.length === 0)		// not a xbox360 titlei
			return;

		var row = res.split('\t');
		var [ released, developer, publisher, categories, imgs, attrs ] = [ 
			new Date(row[1]),							// released
			row[2],										// developer
			row[3],										// publisher
			row[4] ? JSON.parse(row[4]) : {},			// genres
			row[5] ? JSON.parse(row[5]) : {},			// images
			row[6] ? JSON.parse(row[6]) : {},			// attributes
		];

		console.log(id, imgs, attrs);

		d3.select("#celldevel").text(developer);
		d3.select("#cellpublisher").text(publisher);
		d3.select("#cellreleased").text(released ? released.toLocaleDateString() : '');

		var img = imgs.filter(d => d.Purpose === 'BoxArt')[0].ResizeUrl;
		img ??= imgs.filter(d => d.Purpose === 'WideBackgroundImage')[0].ResizeUrl;
		img ??= imgs.filter(d => d.Purpose === 'Thumbnail')[0].ResizeUrl;
		img ??= imgs.filter(d => d.Purpose === 'Image')[0].ResizeUrl;
		img ??= imgs.filter(d => d.Purpose === 'Background')[0].ResizeUrl;

		if( ! img )
            img = 'https://store-images.s-microsoft.com/image/apps.52902.70775362622833233.2297d754-dc3e-47c7-bef3-00c95ef0ef65.c7b5eb4b-0f1a-44ba-bc1d-11617c9a5ee2?mode=scale';
        
		img = img.replace('http://images-eds.', 'https://images-eds-ssl.');
		img += (img.indexOf('?') < 0) ? '?' : '&';
		img += 'w=64';
		popup.select('img').attr('src', img);
		

	}));

	Promise.all(p)
	.then( p => {

		d3.select("#genres").selectAll("span")
		.data(devgenres[id].genreids)
		.join(enter => {
				enter.append('span').text(d => ' ')
					.append('span').classed('cellbox', true).html(g => genres[g].genre.replaceAll(' ', '&nbsp;').replaceAll('-', '&#8209;'));
			}, update => {
				update.classed('cellbox', true).html(g => genres[g].genre.replaceAll(' ', '&nbsp;').replaceAll('-', '&#8209;'));
			}, exit => exit.remove()
		);

		d3.select("#cellplats").selectAll("span")
		.data(devgenres[id].devids)
		.join(enter => {
			enter.append('span').text(d => ' ')
				.append('span').classed('cellbox', true).text(p => devices[p].devname);
		}, update => {
			update.classed('cellbox', true).text(p => devices[p].devname);
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
					t = (cell.gamers.abs === 0) ? '' : t;
					popup.select(`#${sel+p+k}`).text(t);

					// world
					t = compact( ((sel === "t") ? gamers["0"][colsorted[col-1]][p][k] : prevper["0"][colsorted[col-1]][p][k]) * ((k === "perc")? 100 : 1));
					t = t + ((k === "perc") ? "%" : "");
					t = (cell.gamers.abs === 0) ? '' : '(' + t + ')';
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
