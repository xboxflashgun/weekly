var titleids = {};		// titleids[] = { titleid: titleid, name: name, gamers: gamers }
var countries = {};		// countries[] = { coutry: country, countryname: countryname, gamers: gamers }
var gamers = {};		// gamers[] = { titleid: titleid, countryid: countryid, gamers: gamers }
var prevper = {};		// same as gamers for previous period
var devices = [];		// devices[devid] = { gamers, games, devname }

var grouped;

var allcountries = 0;
var allgames = 0;

var sortcol = "0";		// titleid
var sortcolord = 1;
var sortrow = "0";		// countryid
var sortroword = 1;
var show = "gamers";	// cell format: "gamers"/"perc"/"place"
var showdiff = true;	// show difference with previous period
var devsel = new Set;

function main() {

	// devsel.add(2);
	read_data();

}

function draw_table() {

	///////////////
	// sort columns
	show = d3.select('input[name="valform"]:checked').property("value");
	showdiff = d3.select('input[name="showdiff"]').property("checked");

	var filtstr = d3.select("#filter").property("value").toLowerCase();

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

	// Remove information from "All games" cells if "place" option selected
	if(show === "place")
		colsorted.forEach( c => gamers["0"][c][show] = undefined );

	////////////////////////
	// format cells function
	function compact(num) {

		if(compactsel >= 0)
			return new Intl.NumberFormat('en-US', { maximumFractionDigits: compactsel, notation: 'compact' }).format(num)
		else
			return num;

	}

	var allgamers = gamers["0"]["0"].gamers;
	function compact_perc( num )  {

		if(compactsel >= 0)
			return (100*num).toFixed(compactsel) + '%';
		else
			return (100*num).toFixed((base >= 10) ? Math.log10(allgamers) || 0 : 0);

	}


	var fff;	// format function
	var compactsel = 2;
	if(show === "place")
		fff = d => d;
	else if(show === "perc")
		fff = compact_perc;
	else
		fff = compact;

	//////
	// format cells to .cell
	Object.keys(gamers).map(t => Object.keys(gamers[t]).map(c => {

		if(gamers[t][c][show]) {

			gamers[t][c].cell = `${fff(gamers[t][c][show])}`;
			if(showdiff && prevper[t] && gamers[t][c][show] !== prevper[t][c][show])  {

				var grew = (gamers[t][c][show] > prevper[t][c][show]);
				grew = (show === "place") ? !grew : grew;

				gamers[t][c].cell += `<sup class="${ grew ? "arrowup" : "arrowdown"}">`
					+ `${ grew ^ (show === "place")? '+' : '' }`
					+ `${fff(gamers[t][c][show] - prevper[t][c][show])}</sup>`;

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
	// show arrow
	d3.selectAll("th.countries").classed("sortasc", false).classed("sortdesc", false);
	d3.select(`th[data-id="${sortrow}"]`).classed( (sortroword > 0) ? "sortasc" : "sortdesc", true);

	/////////////
	// draw rows
	
	d3.select("#maintable tbody").selectAll('tr')
	.data(rowsorted)
	.join( enter => {

		var tr = enter.append('tr');
		var td = tr.append('td').attr('data-id', d => d);
		td.text(d => titleids[d][0]);

	}, update => {

		var td = update.select("td");
		td.attr('data-id', d => d).text(d => titleids[d][0]);

	}, exit => {

		exit.remove();

	});

	d3.select("#maintable tbody").selectAll('tr td').on('click', e => {

		var newcol = e.target.dataset.id;
		if( newcol === sortcol )
			sortcolord = -sortcolord;
		else
			[ sortcol, sortcolord ] = [ newcol, (show === "place") ? -1 : 1 ];

		draw_table();

	});


	/////////////
	// draw cells
	d3.select("#maintable tbody").selectAll('tr').selectAll('td.cell')
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
	d3.selectAll('#maintable span.clearstr').on('click', e => {

		d3.select("#filter").property("value", "");
		draw_table();

	});

	/////////
	// header sort
	d3.selectAll("th.countries").on('click', e => {

		var newrow = e.target.dataset.id;
		if( newrow === sortrow )
			sortroword = -sortroword;
		else
			[ sortrow, sortroword ] = [ newrow, (show === "place") ? -1 : 1 ];

		draw_table();

	});

	/////////
	// filter
	d3.select("#filter").on('input', e => {

		draw_table();

	});

	// hide filtered out rows
	d3.select("#maintable tbody").selectAll('tr').each( function(t) { 

		d3.select(this).style("display", (
			(filtstr.length > 0 && titleids[t][0].toLowerCase().indexOf(filtstr) < 0)
			|| (show === "place" && t === "0")
			) ? "none" : null);

	});

}


var strparser = [
	0,
	s => {		// titleids
		var row = s.split('\t');
		row[0] = (row[0] === '\\N') ? "0" : row[0];
		titleids[row[0]] = [ row[2], +row[1] ] ;
		allgames += +row[1];
	},
	s => {		// countries
		var row = s.split('\t');
		countries[row[1]] = [ row[2], row[3], +row[0] ];
		allcountries += +row[3];
	},
	s => {		// devices
		var row = s.split('\t');
		devices[row[2]] = { gamers: row[0], games: row[1], devname: row[3] };
	},
	s => {		// gamers
		var row = s.split('\t');
		row[1] = (row[1] === '\\N') ? "0" : row[1];		// countryid
		row[0] = (row[0] === '\\N') ? "0" : row[0];		// titleid
		gamers[row[0]] ??= {};
		gamers[row[0]][row[1]] = { gamers: +row[2] };
	},
	s => {		// previous period
		var row = s.split('\t');
		row[1] = (row[1] === '\\N') ? "0" : row[1];
		row[0] = (row[0] === '\\N') ? "0" : row[0];
		prevper[row[0]] ??= {};
		prevper[row[0]][row[1]] = { gamers: +row[2] };
	},
];


function read_data() {

	var pr = [];

	var devids = (devsel.size > 0) ? `&devids=${Array.from(devsel).join(',')}` : '';

	for( let i = 1; i != 6; i++ )
		pr.push(fetch(`api/gettsv.php?tab=day&num=${i}${devids}`)
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

		// console.log(titleids);
		// console.log(countries);
		// console.log(devices);

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
		pre_calc(prevper);

		console.log(titleids);
		console.log(gamers);
		// console.log(prevper);

		draw_table();

	});

}
