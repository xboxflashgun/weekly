function draw_genre() {

	d3.select("#genretable tbody").selectAll("tr")
	.data(Object.keys(genres).sort( (a,b) => genres[b].gamers - genres[a].gamers))
	.join( enter => {

		var tr = enter.append('tr').attr('data-id', d => d);
		var td = tr.append('td');
		td.append('input').property('type', 'radio').property('name','genreradio').property('checked', d => d === curgenre);
		td.append('span').text(d => (d === "0") ? "All genres" : genres[d].genre);
		tr.append('td').text(d => genres[d].gamers);
		tr.append('td').text(d => genres[d].games);
		tr.append('td').text(d => compact(genres[d].avgh));

	}, update => {

		update.attr('data-id', d => d);
		update.select('td:nth-child(1) input').property('checked', d => d === curgenre);
		update.select('td:nth-child(1) span').text(d => (d === "0") ? "All genres" : genres[d].genre );
		update.select('td:nth-child(2)').text(d => genres[d].gamers);
		update.select('td:nth-child(3)').text(d => genres[d].games);
		update.select('td:nth-child(4)').text(d => compact(genres[d].avgh));

	}, exit => exit.remove()

	);

	/*
	d3.select("#genretable").selectAll("input").on('change', e => {

		curgenre = e.target.dataset.id;
		d3.select("#genressel").text( (curgenre === "0") ? "All" : genres[curgenre].genre);
		draw_table();

	}); */

	d3.select("#genressel").text( (curgenre === "0") ? "All" : genres[curgenre].genre).on('click', () => d3.select("#genrepopup").style("display", null));
	d3.select("#genrepopup .winclose").on('click', e => d3.select("#genrepopup").style("display", "none"));

	d3.select("#genretable tbody").selectAll("tr").on('click', e => {

		for(e = e.target; e.tagName !== 'TR'; e = e.parentNode)
			;

		curgenre = e.dataset.id;
		console.log(curgenre);

		d3.select(`#genretable tr[data-id="${curgenre}"] input`).property('checked', true);
		draw_table();

	});

}
