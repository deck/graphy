this.coreSanity = {
	
	'setUp': function(callback) {
		this.graph = Graphy.create_graph({
			canvas: $('<div></div>'), 
			x_axis_interval: Graphy.interval.hour, 
			x_axis_label_formatter: Graphy.formatters.human_date
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
	
	'value_rect': function(test) {
		var rect = this.graph.value_rect();

		assert.equal(rect.top, 5);
		assert.equal(rect.bottom, 1);
		assert.equal(rect.left, (new Date(2010, 10, 1)).getTime());
		assert.equal(rect.right, (new Date(2010, 10, 4)).getTime());
		
		test.done();
	}
	
};
