var titleids = {};		// titleids[] = { titleid: titleid, name: name, gamers: gamers }
var countries = {};		// countries[] = { coutry: country, countryname: countryname, gamers: gamers }
var gamers = {};		// gamers[] = { titleid: titleid, countryid: countryid, gamers: gamers }
var prevweek = {};		// same as gamers for previous week

var grouped;

var allcountries = 0;
var allgames = 0;

var sortcolnum = 1;
var sortcolord = 1;
var sortrownum = 1;
var sortroword = 1;

function main() {

	read_data();

}

function draw_table() {

	//////////////
	// draw header
	d3.select("#maintable thead tr").selectAll('th.countries')
	.data(Object.keys(countries))
	.join( enter => {
	
		var th = enter.append('th').classed('countries', true)
			.text(d => countries[d][0]);
	
	}, update => {

		update.text(d => countries[d][0]);

	}, exit => {

		exit.remove();

	});

	/////////////
	// draw rows
	var rows = d3.select("#maintable tbody").selectAll('tr')
	.data(Object.keys(gamers))
	.join( enter => {

		var tr = enter.append('tr');
		var td = tr.append('td');
		td.text(d => titleids[d]);

	}, update => {

		update.text(d => titleids[d]);

	}, exit => {

		exit.remove();

	});

	rows = d3.select("#maintable tbody").selectAll('tr');

	/////////////
	// draw cells
	rows.selectAll('td.cell')
	.data( row => Object.keys(gamers[row]).map( col => { return({ c: col, r: row }) } ) )
	.join( enter => {

		enter.append('td').classed('cell', true).text( d => gamers[d.r][d.c].gamers );

	}, update => {

		update.text(d => gamers[d.r][d.c].gamers);

	}, exit => exit.remove()
	);

}

var strparser = [
	0,
	s => {		// titleids
		var row = s.split('\t');
		row[0] = (row[0] === '\\N') ? "0" : row[0];
		titleids[row[0]] = [ row[1], +row[2] ] ;
		allgames += +row[2];
	},
	s => {		// countries
		var row = s.split('\t');
		countries[row[0]] = [ row[1], row[2], +row[3] ];
		allcountries += +row[3];
	},
	s => {		// gamers
		var row = s.split('\t');
		row[0] = (row[0] === '\\N') ? "0" : row[0];		// countryid
		row[1] = (row[1] === '\\N') ? "0" : row[1];		// titleid
		gamers[row[1]] ??= {};
		gamers[row[1]][row[0]] = { gamers: +row[2] };
	},
	s => {		// previous week
		var row = s.split('\t');
		row[0] = (row[0] === '\\N') ? "0" : row[0];
		row[1] = (row[1] === '\\N') ? "0" : row[1];
		prevweek[row[1]] ??= {};
		prevweek[row[1]][row[0]] = { gamers: +row[2] };
	},
];

function read_data() {

	var pr = [];

	for( let i = 1; i != 5; i++ )
		pr.push(fetch("api/gettsv.php?tab=week" + i)
			.then(res => res.text())
			.then(res => {

				res.split('\n').forEach( s => {

					if(s.length === 0)
						return;

					(strparser[i])(s);

				});

			}
		
		));

	Promise.all(pr)
	.then( () => {

		countries["0"] = [ 'World', 'World', allcountries ];
		titleids["0"] = [ 'All games', allgames ];
		console.log(titleids);
		console.log(countries);

		// calculating places and percentage
		function pre_calc( g ) {

			Object.keys(g).forEach( c => {
				Object.keys(g[c]).forEach( t => {

					if(c === "0")
						if(t === "0")
							;
						else 
							g[c][t].perc = g[c][t].gamers / g["0"]["0"].gamers;
					else
						if(t === "0")
							g[c][t].perc = 1;
						else
							g[c][t].perc = g[c][t].gamers / g["0"]["0"].gamers;
	
				});
	
			});

		}

		pre_calc(gamers);
		pre_calc(prevweek);

		console.log(gamers);
		console.log(prevweek);

		draw_table();

	});

}
