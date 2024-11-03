///
function cellinfo(e) {

	var td = e.target.closest('TD');
	var col = td.cellIndex;

	if(col < 1)
		return;

	var id = d3.select(td.parentNode).select('td').node().dataset.id;
	console.log(td, td.cellIndex, id);




}
