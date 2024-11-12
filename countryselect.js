var consortcol = 1;
var consortord = 1;

function draw_country() {

	var sortfunc = [
		(a,b) => consortord * countries[a].country.toLowerCase().localeCompare(countries[b].country.toLowerCase()),
		(a,b) => consortord * (countries[b].gamers - countries[a].gamers),
		(a,b) => consortord * (countries[b].avgh - countries[a].avgh)
	];

	var div = d3.select("#countryselect");

	div.select("tbody").selectAll("tr")
	.data(Object.keys(countries).filter(d => d !== '0').sort( sortfunc[consortcol] ))
	.join( enter => {

		var tr = enter.append('tr').attr('data-id', d => d);
		var td = tr.append('td').attr('title', d => countries[d].countryname);
		td.append('input').property('type', 'checkbox').property('name', d => d);
		td.append('span').text(d => countries[d].country);
		tr.append('td').text(d => countries[d].gamers);
		tr.append('td').text(d => compact(countries[d].avgh));

	}, update => {

		update.select('tr').attr('data-id', d => d);
		update.select('td:nth-child(1)').attr('title', d => countries[d].countryname);
		update.select('td:nth-child(1) span').text(d => countries[d].country);
		update.select('td:nth-child(2)').text(d => countries[d].gamers);
		update.select('td:nth-child(3)').text(d => compact(countries[d].avgh));

	}, exit => exit.remove()
	);

	div.select("tbody").selectAll('tr').on('click', e => {

		if(e.target.tagName !== 'INPUT')	{

			var c = e.target.closest('TR').dataset.id;
			var s = d3.select(`div input[name="${c}"]`);
			s.property('checked', ! s.property('checked'));

		}

		draw_table();

	});

	// sort columns
	div.selectAll('th').on('click', e => {

		var newcol = +e.target.cellIndex;
		if( newcol === consortcol )
			consortord = -consortord;
		else
			[ consortcol, consortord ] = [ newcol, 1 ];

		draw_country();

	});

	div.select(".winclose").on('click', e => div.style("display", "none"));
	d3.select("#countsel").on('click', e => div.style("display", null));

	window_drag(div);
	var maxnum = [ 5, 10, 15, -1 ];

	d3.select("#countrymark").on('click', e => {

		var sel = +e.target.dataset.id;
		div.select("tbody").selectAll("input").each( function(c, i) {

			d3.select(this).property('checked', i < maxnum[sel]);

		});

		draw_table();

	});

}

