var titleids = {};		// titleids[] = { titleid: titleid, name: name, gamers: gamers secs: secs}
var countries = {};		// countries[] = { coutry: country, countryname: countryname, gamers: gamers }
var gamers = {};		// gamers[] = { titleid: titleid, countryid: countryid, gamers: gamers }
var prevper = {};		// same as gamers for previous period
var devices = {};		// devices[devid] = { gamers, games, devname }
var periods = {};		// periods[period] = { ts1: ts2: ts3 } 
var devgenres = {};		// devgenres[titleid] = { devids: [1,2,3], genreids: [6,7,8] };
var genres = {};		// genrelist[genreid] = "genre"

var grouped;

var allcountries;
var allgames;
var alldevices;

var sortcol = "0";		// titleid
var sortcolord = 1;
var sortrow = "0";		// countryid
var sortroword = 1;
var show = "abs";	// cell format: "gamers"/"perc"/"place"
var dim  = "avgh";	// table info: "gamers"/"avgh"
var showdiff = true;	// show difference with previous period
var devsel = new Set;
var period = "week";
var colsorted = [];

var compactsel = 1;

function main() {

	// hide device popup
	d3.select("#devpopup").style("display", "none");
	d3.select("#cellinfo").style("display", "none");

	// devsel.add("13");

	read_data();

}

function setcompact(e) {

	compactsel = +d3.select("#compactsel option:checked").property("value");
	draw_table();
	draw_devices();

}

////////////////////////
// format cells function
function compact(num) {

	if(compactsel >= 0)
		return new Intl.NumberFormat('en-US', { maximumFractionDigits: compactsel, notation: 'compact' }).format(num)
	else
		return num;

}

function draw_table() {

	///////////////
	// sort columns
	show = d3.select('input[name="valform"]:checked').property("value");
	showdiff = d3.select('input[name="showdiff"]').property("checked");
	dim = d3.select('input[name="dim"]:checked').property("value");

	var filtstr = d3.select("#filter").property("value").toLowerCase();

	colsorted = Object.keys(gamers[sortcol]);

	const sort1 = function(a, b) { return sortcolord * (gamers[sortcol][b][dim][show] - gamers[sortcol][a][dim][show]); };

	colsorted.sort(sort1);



	////////////
	// sort rows
	var rowsorted = Object.keys(gamers);

	const sort2 = function(a, b) { return sortroword * (gamers[b][sortrow][dim][show] - gamers[a][sortrow][dim][show]); };

	rowsorted.sort(sort2);
	if(show === "place")
		rowsorted.reverse();

	// Remove information from "All games" cells if "place" option selected
	if(show === "place")
		colsorted.forEach( c => gamers["0"][c][show] = undefined );

	var allgamers = gamers["0"]["0"][dim].abs;
	function compact_perc( num )  {

		if(compactsel >= 0)
			return (100*num).toFixed(compactsel) + '%';
		else
			return (100*num).toFixed((base >= 10) ? Math.log10(allgamers) || 0 : 0);

	}


	var fff;	// format function
	if(show === "place")
		fff = d => d;
	else if(show === "perc")
		fff = compact_perc;
	else
		fff = compact;

	////////////////////////
	// format cells to .cell
	Object.keys(gamers).map(t => Object.keys(gamers[t]).map(c => {

		if(gamers[t][c][dim][show]) {

			gamers[t][c].cell = `${fff(gamers[t][c][dim][show])}`;
			if(showdiff && prevper[t] && gamers[t][c][dim][show] !== prevper[t][c][dim][show])  {

				var grew = (gamers[t][c][dim][show] > prevper[t][c][dim][show]);
				grew = (show === "place") ? !grew : grew;

				gamers[t][c].cell += `<sup class="${ grew ? "arrowup" : "arrowdown"}">`
					+ `${ grew ^ (show === "place")? '+' : '' }`
					+ `${fff(gamers[t][c][dim][show] - prevper[t][c][dim][show])}</sup>`;

			}

		} else
			gamers[t][c].cell = '';

	}));

	//////////////
	// draw countries (header)
	d3.select("#maintable thead tr").selectAll('th.countries')
	.data(colsorted)
	.join( enter => {
	
		var th = enter.append('th').classed('countries', true);
		th.attr("data-id", d => d).attr("title", d => countries[d].countryname);
		th.text(d => countries[d].country);
	
	}, update => {

		update.attr("data-id", d => d).attr("title", d => countries[d].countryname);
		update.text(d => countries[d].country);

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
		td.text(d => titleids[d].name);
		td.attr('title', d => 'Platform(s): ' + devgenres[d].devids.map( e => devices[e].devname ).join(', ') 
			+ '\nGenres: ' + devgenres[d].genreids.map( g => genres[g]).join(', '));

	}, update => {

		var td = update.select("td");
		td.attr('data-id', d => d).text(d => titleids[d].name);

	}, exit => {

		exit.remove();

	});

	d3.select("#maintable tbody .sortright").classed("sortright", false);
	d3.select("#maintable tbody .sortleft").classed("sortleft", false);
	d3.select("#maintable tbody").selectAll(`td[data-id="${sortcol}"]`).classed( (sortcolord > 0) ? "sortright" : "sortleft", true);

	d3.select("#maintable tbody").selectAll('tr td:first-child').on('click', e => {

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
	.data( (row,i) => colsorted.map( (col,j) => ({r: rowsorted[i], c: colsorted[j]}) ) )
	.join( enter => {

		enter.append('td').classed('cell', true).html( d => gamers[d.r][d.c].cell );

	}, update => {

		update.html(d => gamers[d.r][d.c].cell);

	}, exit => exit.remove()
	);

	///////////
	// events
	d3.selectAll('#params input[type="checkbox"]').on('change', draw_table);
	d3.selectAll('#params input[type="radio"]').on('change', draw_table);
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
			[ sortrow, sortroword ] = [ newrow, 1 ] ;

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
			(filtstr.length > 0 && titleids[t].name.toLowerCase().indexOf(filtstr) < 0)
			|| (show === "place" && t === "0")
			) ? "none" : null);

	});

	// mark row/column for world/allgames
	d3.select("tr.allgames").classed("allgames", false);
	d3.select('tr:has(td[data-id="0"])').classed('allgames', show !== "place");
	d3.selectAll("td.allgames").classed("allgames", false);
	d3.selectAll(`#maintable td:nth-child(${colsorted.indexOf("0") + 2})`).classed("allgames", true);

	// cell info (cellinfo.js)
	d3.select("#maintable tbody").on('click', cellinfo);

}

///////////////////////////
// parse answer from db api
var strparser = [
	s => {		// 0:
		var row = s.split('\t');	// [ ts1, ts2, ts3, period, accuracy ]
		periods[row[3]] = {
			ts1: new Date(row[0]),
			ts2: new Date(row[1]),
			ts3: new Date(row[2]),
			accuracy: (+row[4] * 100).toFixed(2) + '%'
		};
	},
	s => {		// 1: titleids
		var row = s.split('\t');	// [ titleid, gamers, secs, name ]
		var t = (row[0] === '\\N') ? "0" : row[0];
		titleids[t] = { name: row[3], gamers: +row[1], secs: +row[2] } ;
		allgames += +row[1];
	},
	s => {		// 2: countries
		var row = s.split('\t');	// [ gamers, secs, countryid, country, countryname ]
		var c = (row[2] === '\\N') ? "0" : row[2];
		countries[c] = { country: row[3], countryname: row[4], gamers: +row[0], secs: +row[1] };
		allcountries += +row[0];
	},
	s => {		// 3: devices
		var row = s.split('\t');	// [ gamers, games, secs, devid, devname ]
		var d = (row[3] === '\\N') ? "0" : row[3];
		devices[d] = { gamers: +row[0], games: +row[1], secs: +row[2], devname: row[4], avgh: +row[2]/+row[0]/3600 };
		alldevices++;
	},
	s => {		// 4: gamers [ titleid, countryid, gamers, secs ]
		var row = s.split('\t');
		var t = (row[0] === '\\N') ? "0" : row[0];		// titleid
		var c = (row[1] === '\\N') ? "0" : row[1];		// countryid
		gamers[t] ??= {};
		gamers[t][c] ??= {};
		var g = +row[2];
		gamers[t][c].gamers = { abs: g };
		gamers[t][c].avgh = { abs: (g > 0) ? +row[3]/g/3600 : 0 };
	},
	s => {		// 5: previous period
		var row = s.split('\t');
		var t = (row[0] === '\\N') ? "0" : row[0];		// titleid
		var c = (row[1] === '\\N') ? "0" : row[1];		// countryid
		prevper[t] ??= {};
		prevper[t][c] ??= {};
		var g = +row[2];
		prevper[t][c].gamers = { abs: g };
		prevper[t][c].avgh = { abs: (g > 0) ? +row[3]/g/3600 : 0 };
	},
	s => {		// 6: titleid, devs, genres
		var row = s.split('\t');
		var t = (row[0] === '\\N') ? "0" : row[0];      // titleid
		devgenres[t] = { devids: row[1].split(','), genreids: row[2].split(',') };
	},
	s => {		// 7: genreid, genre
		var row = s.split('\t');
		genres[row[0]] = row[1];
	},
];

////////////////
// devices table
function draw_devices() {

	d3.select("#devtable tbody").selectAll("tr")
	.data(Object.keys(devices).sort( (a,b) => devices[b].gamers - devices[a].gamers))
	.join( enter => {
		
		var tr = enter.append('tr');
		tr.attr('data-id', d => d);
		tr.append('td').append('input').property('type', 'checkbox').attr('data-id', d => d).property('checked', d => devsel.has(d));
		tr.append('td').text(d => devices[d].devname);
		tr.append('td').text(d => devices[d].gamers);
		tr.append('td').text(d => devices[d].games);
		tr.append('td').text(d => compact(devices[d].avgh));
		
	}, update => {

		update.select('td:nth-child(1)').property('type', 'checkbox').attr('data-id', d => d.devid).property('checked', d => devsel.has(d.devid));
		update.select('td:nth-child(2)').text(d => devices[d].devname);
		update.select('td:nth-child(3)').text(d => devices[d].gamers);
		update.select('td:nth-child(4)').text(d => devices[d].games);
		update.select('td:nth-child(5)').text(d => compact(devices[d].avgh));
	
	}, exit => exit.remove()
	);

	d3.select("#devtable tbody").selectAll("tr").on('click', e => {		// click on row
		if(e.target.tagName === 'TD') {
		
			var devid = e.target.parentNode.dataset.id;
			if(devsel.has(devid))
				devsel.delete(devid);
			else
				devsel.add(devid);
			d3.select(e.target.parentNode).select('input').property('checked', devsel.has(devid));

		} else {

			var devid = e.target.dataset.id;
			if(d3.select(e.target).property('checked'))
				devsel.add(devid);
			else
				devsel.delete(devid);

		}

		read_data();

	});

	d3.select("#devselect").text( devsel.size ? `${devsel.size} / ${alldevices}` : "All" )
		.on('click', e => d3.select("#devpopup").style("display", null)); 
	d3.select("#devpopup .winclose").on('click', e => d3.select("#devpopup").style("display", "none"));

}

//////////////
// draw period

function period_totext(ts3, ts2) {

	var pername;

	if(period === "day")
		pername = ts3.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
	if(period === "week")
		if(ts2.getMonth() === ts3.getMonth() || (ts2.getMonth() !== ts3.getMonth() && ts3.getDate() === 1))
			pername = ts2.getDate() + ' - ' + (ts2.getDate() + 6) + ' ' + ts3.toLocaleDateString(undefined, { month: "short", year: "numeric" });
		else if(ts2.getFullYear === ts3.getFullYear)
			pername = ts2.getDate() + ' ' + ts2.toLocaleDateString(undefined, { month: "short"})
				+ ' - ' + (ts3.getDate() - 1) + ' ' + ts3.toLocaleDateString(undefined, { month: "short", year: "numeric" });
		else
			pername = ts2.getDate() + ' ' + ts2.toLocaleDateString(undefined, { month: "short", year: "numeric" })
				+ ' - ' + (ts2.getDate() + 6) + ' ' + ts3.toLocaleDateString(undefined, { month: "short", year: "numeric" });
	if(period === 'month')
		pername = ts2.toLocaleDateString(undefined, { month: "short", year: "numeric" });
	if(period === 'year')
		pername = ts2.toLocaleDateString(undefined, { year: "numeric" });

	return pername;

}

function draw_period() {

	var d = periods[period];
	
	d3.selectAll(".periodterm").text(period.charAt(0).toUpperCase() + period.slice(1));		// Week/Month/Day
	d3.selectAll(".period").text(period_totext(d.ts3, d.ts2));
	d3.selectAll(".prevperiod").text(period_totext(d.ts2, d.ts1));

}

function read_data() {

	var pr = [];

	gamers = {};
	prevper = {};
	titleids = {};
	countries = {};
	devgenres = {};
	genres = {};
	
	allcountries = 0;
	allgames = 0;
	alldevices = 0;
	sortcol = "0";
	sortcolord = 1;
	sortrow = "0";
	sortroword = 1;

	var devids = (devsel.size > 0) ? `&devids=${Array.from(devsel).join(',')}` : '';

	for( let i = 0; i <= 7; i++ )
		pr.push(fetch(`api/gettsv.php?tab=${period}&num=${i}${devids}`)
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

		countries["0"] = { country: 'World', countryname: 'World' };
		titleids["0"] = { name: 'All games' };

		// calculating places and percentage
		function pre_calc( g ) {

			// percentage
			Object.keys(g).forEach( t => {
				Object.keys(g[t]).forEach( c => {
					[ "gamers", "avgh" ].forEach( d => {

						if(t === "0")
							g[t][c][d].perc = 1;
						else
							if(c === "0")
								g[t][c][d].perc = g[t][c][d].abs / g["0"]["0"][d].abs;
							else
								g[t][c][d].perc = g[t][c][d].abs / g["0"][c][d].abs;

					});
	
				});
	
			});

			// places
			[ "gamers", "avgh" ].forEach( d => {
				Object.keys(g["0"]).forEach( c => {		// cycle by country for "All games"

					var place = 1;
					Object.keys(g).toSorted( (a,b) => g[b][c][d].abs - g[a][c][d].abs ).map( t => (t === "0") ? 0 : g[t][c][d].place = place++);

				});

			});

		}

		// remove empty strings
		Object.keys(gamers).forEach( t => {

			if(gamers[t])
				if(! gamers[t]["0"] || (gamers[t]["0"]["gamers"] && gamers[t]["0"]["gamers"].abs === 0)) {

				delete gamers[t];
				delete prevper[t];

			}
			if(prevper[t])
				if(! prevper[t]["0"] || (prevper[t]["0"]["gamers"] && prevper[t]["0"]["gamers"].abs === 0))
					delete prevper[t];

		});
		// remove strings from prevper missed in gamers
		Object.keys(prevper).forEach( t => {

			if(! gamers[t])
				delete prevper[t];

		});

		pre_calc(gamers);
		pre_calc(prevper);
		
		draw_table();
		draw_devices();
		draw_period();
		d3.select("#accuracy").text(periods[period].accuracy);	// data capture downtime
		
		console.log(devgenres);
		console.log(genres);

	});

}
