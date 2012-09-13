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

describe("Graphy.interval", function() {

  it ("should floor to the 1st of the month", function() {
		var date = new Date(2012, 8, 17, 3, 22, 12);
		var flooredDate = Graphy.interval.floor(date, Graphy.interval.month);
		var expectedFlooredDate = new Date(2012, 8, 1, 0, 0, 0, 0);
		
		expect(flooredDate).toEqual(expectedFlooredDate);
  });

	it ("should step to tomorrow", function() {
		var date = new Date(2012, 8, 17, 3, 22, 12);
		var steppedMS = Graphy.interval.stepDate(date, Graphy.interval.day);
		var expectedSteppedDate = new Date(2012, 8, 18, 0, 0, 0, 0);
		
		expect(steppedMS).toBe(expectedSteppedDate.getTime());
  });

	it ("should figure out that day is hour's next big thing", function() {
		var hour = Graphy.interval.hour;
		var day = Graphy.interval.day;
		
		expect(Graphy.interval.biggerInterval(hour)).toBe(day);
  });

});
