//
function draw_periods() {

	fetch("api/getperiods.php")
	.then(res => res.json())
	.then(res => {

		var tab = d3.select("#periodselect tbody");
		tab.selectAll('*').remove();

		res.forEach(r => {

			if(! r.gamers4)
				return;

			// convert to numbers
			[ "accuracy", "avgsecs", "gamers4", "gamers5", "hours4", "hours5" ].forEach(k => r[k] = +r[k]);

			var tr = tab.append('tr');
			var label = tr.append('td').append('label');
				label.append('input').attr('type', 'radio').attr('value', r.period).attr('name', 'period').property('checked', period === r.period);
				label.append('span').text(r.period.charAt(0).toUpperCase() + r.period.slice(1));

			tr.append('td').text(period_totext(new Date(r.ts3), new Date(r.ts2), r.period));

			var flg = (r.gamers4 > r.gamers5);
			var td = tr.append('td').attr('title', 'compared to previous ' + r.period);
			td.append('span').text(compact(r.gamers4));
			td.append('br');
			td.append('span').classed( flg ? 'arrowup' : 'arrowdown', true).text( (flg ? '+' : '') + compact(r.gamers4 - r.gamers5));

			flg = (r.hours4 > r.hours5);
			td = tr.append('td').attr('title', 'compared to previous ' + r.period);
			td.append('span').text(compact(r.hours4));
			td.append('br');
			td.append('span').classed( flg ? 'arrowup' : 'arrowdown', true).text( (flg ? '+' : '') + compact(r.hours4 - r.hours5));

			tr.append('td').text('~' + compact(100*(1 - r.accuracy)) + '%');
			tr.append('td').text( `${((r.avgsecs / 60) | 0)}:${r.avgsecs % 60}`);

		});

		window_drag(d3.select("#periodselect"));
		d3.select("#params .period").on('click', () => d3.select("#periodselect").style("display", null));
		d3.select("#periodselect .winclose").on('click', e => d3.select("#periodselect").style("display", "none"));

		tab.selectAll('input').on('change', e => {

			period = e.target.value;
			read_all_data();

		});

	});

}

