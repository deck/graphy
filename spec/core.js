// This file is part of Graphy from DECK Monitoring LLC.
// 
// Graphy is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser Public License
// as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later 
// version.
//
// Graphy is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
// warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser Public License for more details.
//
// You should have received a copy of the Lesser General Public License along with Graphy. If not, see 
// <http://www.gnu.org/licenses/>.
//

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
