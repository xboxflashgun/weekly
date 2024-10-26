var titleids = {};		// titleids[] = { titleid: titleid, name: name, gamers: gamers }
var countries = {};		// countries[] = { coutry: country, countryname: countryname, gamers: gamers }
var gamers = {};		// gamers[] = { titleid: titleid, countryid: countryid, gamers: gamers }
var prevweek = {};		// same as gamers for previous week

var grouped;

var allcountries = 0;
var allgames = 0;

var sortcol = "0";		// titleid
var sortcolord = 1;
var sortrow = "0";		// countryid
var sortroword = 1;
var show = "gamers";	// cell format: "gamers"/"perc"/"place"
var showdiff = true;	// show difference with previous week

function main() {

	read_data();

}

function draw_table() {

	///////////////
	// sort columns
	show = d3.select('input[name="valform"]:checked').property("value");
	showdiff = d3.select('input[name="showdiff"]').property("checked");

	var colsorted = Object.keys(gamers[sortcol]);

	const sort1 = function(a, b) { return sortcolord * (gamers[sortcol][b][show] - gamers[sortcol][a][show]); };

	colsorted.sort(sort1);

	////////////
	// sort rows
	var rowsorted = Object.keys(gamers);

	const sort2 = function(a, b) { return sortroword * (gamers[b][sortrow][show] - gamers[a][sortrow][show]); };

	rowsorted.sort(sort2);
	if(show === "place")
		rowsorted.reverse();

	//////
	// format cells to .cell
	Object.keys(gamers).map(t => Object.keys(gamers[t]).map(c => {

		if(gamers[t][c][show]) {

			gamers[t][c].cell = `${gamers[t][c][show]}`;
			if(showdiff && prevweek[t] && gamers[t][c][show] !== prevweek[t][c][show])  {

				var grew = (gamers[t][c][show] > prevweek[t][c][show]);
				grew = (show === "place") ? !grew : grew;

				gamers[t][c].cell += `<sup class="${ grew ? "arrowup" : "arrowdown"}">${ grew ? '+' : '' }${gamers[t][c][show] - prevweek[t][c][show]}</sup>`;

			}

		}

	}));

	//////////////
	// draw header
	d3.select("#maintable thead tr").selectAll('th.countries')
	.data(colsorted)
	.join( enter => {
	
		var th = enter.append('th').classed('countries', true);
		th.attr("data-id", d => d);
		th.text(d => countries[d][0]);
	
	}, update => {

		update.attr("data-id", d => d);
		update.text(d => countries[d][0]);

	}, exit => {

		exit.remove();

	});

	/////////////
	// draw rows
	var rows = d3.select("#maintable tbody").selectAll('tr')
	.data(rowsorted)
	.join( enter => {

		var tr = enter.append('tr');
		var td = tr.append('td');
		td.text(d => titleids[d][0]);

	}, update => {

		update.text(d => titleids[d][0]);

	}, exit => {

		exit.remove();

	});

	rows = d3.select("#maintable tbody").selectAll('tr');

	/////////////
	// draw cells
	rows.selectAll('td.cell')
	.data( (row,i) => colsorted.map( (col,j) => ({r: rowsorted[i],c: colsorted[j]}) ) )
	.join( enter => {

		enter.append('td').classed('cell', true).html( d => gamers[d.r][d.c].cell );

	}, update => {

		update.html(d => gamers[d.r][d.c].cell);

	}, exit => exit.remove()
	);

	///////////
	// events
	d3.selectAll('input[type="checkbox"]').on('change', draw_table);
	d3.selectAll('input[type="radio"]').on('change', draw_table);

	/////////
	// header sort
	d3.selectAll("th.countries").on('click', e => {

		var newrow = e.target.dataset.id;
		if( newrow === sortrow )
			sortroword = -sortroword;
		else
			[ sortrow, sortroword ] = [ newrow, 1 ];

		draw_table();

	});

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

		// calculating places and percentage
		function pre_calc( g ) {

			// percentage
			Object.keys(g).forEach( t => {
				Object.keys(g[t]).forEach( c => {

					if(t === "0")
						g[t][c].perc = 1;
					else
						if(c === "0")
							g[t][c].perc = g[t][c].gamers / g["0"]["0"].gamers;
						else
							g[t][c].perc = g[t][c].gamers / g["0"][c].gamers;
	
				});
	
			});

			// places
			Object.keys(g["0"]).forEach( c => {		// cycle by country for "All games"

				var place = 1;
				Object.keys(g).toSorted( (a,b) => g[b][c].gamers - g[a][c].gamers ).map( t => (t === "0") ? 0 : g[t][c].place = place++);

			});

		}

		pre_calc(gamers);
		pre_calc(prevweek);

		console.log(gamers);
		console.log(prevweek);

		draw_table();

	});

}
