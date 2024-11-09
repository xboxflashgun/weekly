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

		update.select('td:nth-child(1)').attr('data-id', d => d.devid).property('checked', d => devsel.has(d.devid));
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

	window_drag(d3.select("#devpopup"));

}


