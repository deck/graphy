describe("Graphy.core", function() {
	
	beforeEach(function() {
		if (!this.graph) {
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
		}
	});

	it ("should calculate a proper valueRect", function() {
		var rect = this.graph.valueRect();
		
		expect(rect.top).toBe(5);
		expect(rect.bottom).toBe(1);
		expect(rect.left).toBe((new Date(2010, 10, 1)).getTime());
		expect(rect.right).toBe((new Date(2010, 10, 4)).getTime());
  });

});
