this.coreSanity = {
	
	'setUp': function(callback) {
		this.graph = Graphy.createGraph({
			canvas: $('<div></div>'), 
			xAxisInterval: Graphy.interval.hour, 
			xAxisLabelFormatter: Graphy.formatters.humanDate
		});
		
		this.graph.plot(
			[
				[new Date(2010, 10, 1), 1],
				[new Date(2010, 10, 2), 2],
				[new Date(2010, 10, 3), 1],
				[new Date(2010, 10, 4), 5]
			], 
			{ 
				renderer: 'line',
				color: 'red',
				unit: 'label'
			} 
		);
		
		this.graph.draw();
		callback();
	},
	
	'valueRect': function(test) {
		var rect = this.graph.valueRect();

		assert.equal(rect.top, 5);
		assert.equal(rect.bottom, 1);
		assert.equal(rect.left, (new Date(2010, 10, 1)).getTime());
		assert.equal(rect.right, (new Date(2010, 10, 4)).getTime());
		
		test.done();
	}
	
};
