var titleids = {};		// titleids[titleid] = [ name, gamers ]
var countries = {};		// countries[countryid] = [ coutry, countryname, gamers ]
var gamers = {};		// gamers[titleid][countryid] = gamers

var prevweek = {};		// same as gamers for previous week

var allcountries = 0;
var allgames = 0;

var sortcol = 1;
var sortrow = 1;

function main() {

	read_data();

}

function draw_table() {

	var table = d3.select("#maintable");

}

var strparser = [
	0,
	s => {		// titleids
		var row = s.split('\t');
		row[0] = (row[0] === '\\N') ? "0" : row[0];
		titleids[row[0]] = [ row[1], +row[2] ];
		allgames += +row[2];
	},
	s => {		// countries
		var row = s.split('\t');
		countries[row[0]] = [ row[1], row[2], +row[3] ];
		allcountries += +row[3];
	},
	s => {		// gamers
		var row = s.split('\t');
		row[0] = (row[0] === '\\N') ? "0" : row[0];
		row[1] = (row[1] === '\\N') ? "0" : row[1];
		gamers[row[1]] ??= {};
		gamers[row[1]][row[0]] = +row[2];
	},
	s => {		// prev week
		var row = s.split('\t');
		row[0] = (row[0] === '\\N') ? "0" : row[0];
		row[1] = (row[1] === '\\N') ? "0" : row[1];
		prevweek[row[1]] ??= {};
		prevweek[row[1]][row[0]] = +row[2];
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
		titleids["0"] = [ 'All games', 'All games', allgames];
		console.log(titleids);
		console.log(countries);
		console.log(gamers);
		console.log(prevweek);

		draw_table();

	});

}
