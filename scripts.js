var titleids = {};		// titleids[] = { titleid: titleid, name: name, gamers: gamers secs: secs}
var countries = {};		// countries[] = { coutry: country, countryname: countryname, gamers: gamers }
var gamers = {};		// gamers[] = { titleid: titleid, countryid: countryid, gamers: gamers }
var prevper = {};		// same as gamers for previous period
var devices = {};		// devices[devid] = { gamers, games, devname }
var periods = {};		// periods[period] = { ts1: ts2: ts3 } 
var devgenres = {};		// devgenres[titleid] = { devids: [1,2,3], genreids: [6,7,8] };
var genres = {};		// genrelist[genreid] = { genre, gamers, games, avgh };
var langs = {};			// langs[countryid] = { lang: , path: }

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
var colsorted;
var curgenre;		// current genre

var compactsel = 1;

function main() {

	// hide popups
	d3.selectAll(".popupbox").style("display", "none");

	// devsel.add("7");		// Xbox360
	// devsel.add("4");		// WindowsOneCore

	read_data();

}

function setcompact(e) {

	compactsel = +d3.select("#compactsel option:checked").property("value");
	draw_table();
	draw_devices();
	draw_genre();
	draw_country();
	draw_periods();

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

	d3.select("footer a").property('href', `/xboxstat.com.ta.${period}.csv.bz2`);

	var filtstr = d3.select("#filter").property("value").toLowerCase();

	// colsorted = Object.keys(gamers[sortcol]);
	// colsorted.splice(2,2);

	colsorted = ["0"];
	d3.selectAll("#countryselect input:checked").each( d => colsorted.push(d) );

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
			return (100*num).toFixed((allgamers >= 10) ? Math.log10(allgamers) || 0 : 0) + '%';

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

			if(gamers[t][c].gamers.abs === 0)
				if(prevper[t][c].gamers.abs === 0)
					gamers[t][c].cell = '<span class="out">&mdash;</span>';
				else
					gamers[t][c].cell = '<span class="out">OUT</span>';
			else {

				gamers[t][c].cell = `${fff(gamers[t][c][dim][show])}`;
				if(showdiff && prevper[t] && gamers[t][c][dim][show] !== prevper[t][c][dim][show])  {

					var grew = (gamers[t][c][dim][show] > prevper[t][c][dim][show]);
					grew = (show === "place") ? !grew : grew;

					if( prevper[t][c].gamers.abs === 0)
						gamers[t][c].cell += '<sup class="new">NEW</sup>';
					else
						gamers[t][c].cell += `<sup class="${ grew ? "arrowup" : "arrowdown"}">`
							+ `${ grew ^ (show === "place")? '+' : '' }`
							+ `${fff(gamers[t][c][dim][show] - prevper[t][c][dim][show])}</sup>`;

				} else if(showdiff && !prevper[t])
					gamers[t][c].cell += '<sup class="new">NEW</sup>';

			}

		} else
			gamers[t][c].cell = `<span class="out">${( !!prevper[t] && prevper[t][c].gamers.abs > 0) ? "OUT" : "&mdash;"}</span>`;

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
	// d3.select("#maintable thead tr").append('th').classed('bold', true).html('&#xff0b;');

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
			+ '\nGenres: ' + devgenres[d].genreids.map( g => genres[g].genre ).join(', '));

	}, update => {

		var td = update.select("td");
		td.attr('data-id', d => d).text(d => titleids[d].name);
		td.attr('title', d => 'Platform(s): ' + devgenres[d].devids.map( e => devices[e].devname ).join(', ') 
			+ '\nGenres: ' + devgenres[d].genreids.map( g => genres[g].genre).join(', '));

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
			|| (curgenre !== "0" && ! devgenres[t].genreids.includes(curgenre))
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
		countries[c] = { country: row[3], countryname: row[4], gamers: +row[0], secs: +row[1], avgh: +row[1]/+row[0]/3600 };
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
		var g = (row[2] === '\\N') ? "0" : row[2];		// genres
		devgenres[t] = { devids: row[1].split(','), genreids: g.split(',') };
	},
	s => {		// 7: genreid, genre, gamers, games, avgh
		var row = s.split('\t');
		genres[row[0]] = { genre: row[1], gamers: +row[2], games: +row[3], avgh: +row[2]/+row[3]/3600 };
	},
	s => {		// 8: countryid, lang, path
		var row = s.split('\t');
		langs[row[0]] = { lang: row[1], path: row[2] };
	},
];

//////////////
// draw period

function period_totext(ts3, ts2, per) {

	var pername;

	if(per === "day")
		pername = ts3.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
	if(per === "week")
		if(ts2.getMonth() === ts3.getMonth() || (ts2.getMonth() !== ts3.getMonth() && ts3.getDate() === 1))
			pername = ts2.getDate() + ' - ' + (ts2.getDate() + 6) + ' ' + ts3.toLocaleDateString(undefined, { month: "short", year: "numeric" });
		else if(ts2.getFullYear === ts3.getFullYear)
			pername = ts2.getDate() + ' ' + ts2.toLocaleDateString(undefined, { month: "short"})
				+ ' - ' + (ts3.getDate() - 1) + ' ' + ts3.toLocaleDateString(undefined, { month: "short", year: "numeric" });
		else
			pername = ts2.getDate() + ' ' + ts2.toLocaleDateString(undefined, { month: "short", year: "numeric" })
				+ ' - ' + (ts2.getDate() + 6) + ' ' + ts3.toLocaleDateString(undefined, { month: "short", year: "numeric" });
	if(per === 'month')
		pername = ts2.toLocaleDateString(undefined, { month: "short", year: "numeric" });
	if(per === 'year')
		pername = ts2.toLocaleDateString(undefined, { year: "numeric" });

	return pername;

}

function draw_period() {

	var d = periods[period];
	
	d3.selectAll(".periodterm").text(period.charAt(0).toUpperCase() + period.slice(1));		// Week/Month/Day
	d3.selectAll(".period").text(period_totext(d.ts3, d.ts2, period));
	d3.selectAll(".prevperiod").text(period_totext(d.ts2, d.ts1, period));

}

function read_all_data() {		// in case of switch to new period

	devices = {};
	devsel = new Set;
	periods = {};
	langs = {};
	colsorted = [];
	curgenre = "0";

	read_data();

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
	langs["0"] = { lang: 'Neutral', path: '' };

	var devids = (devsel.size > 0) ? `&devids=${Array.from(devsel).join(',')}` : '';

	for( let i = 0; i < strparser.length; i++ )
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
		
		curgenre = "0";
		devgenres["0"].genreids = Object.keys(genres);
		genres["0"] = { genre: '', gamers: gamers["0"]["0"].gamers.abs, games: Object.keys(gamers).length - 1 };
		genres["0"].avgh = genres["0"].gamers/genres["0"].games/3600;

		// console.log('devgenres', devgenres);
		// console.log('genres', genres);

		draw_country();
		d3.select("#countryselect tbody").selectAll('input').property('checked', true);		// mark all countries
	
		draw_table();
		draw_devices();
		draw_period();
		draw_genre();
		draw_periods();
		
	});

}

function window_drag(selector) {

	selector.call(d3.drag()
		.on('start', e => selector.style("cursor", "grab"))
		.on('drag',  e => {

			selector.style("top", selector.node().offsetTop + e.dy + "px")
				 .style("left", selector.node().offsetLeft + e.dx + "px");

		})
		.on('end', e => selector.style("cursor", "default"))
	);

}

