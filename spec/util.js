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

describe("Graphy.util", function() {
	
	it("should create a rectangle from an object", function() {
		var rect = Graphy.util.createRect({top: 10, bottom: 0, left: 0, right: 10});
		expect(rect.top).toBe(10);
		expect(rect.bottom).toBe(0);
		expect(rect.left).toBe(0);
		expect(rect.right).toBe(10);
	});
	
	it("should create a rectangle from an array of points", function() {
		var rect = Graphy.util.createRect([[0, 0], [5, 50]]);
		expect(rect.top).toBe(50);
		expect(rect.bottom).toBe(0);
		expect(rect.left).toBe(0);
		expect(rect.right).toBe(5);
	});
	
	it("should create a rectangle from an array of only one point", function() {
		var rect = Graphy.util.createRect([[5, 50]]);
		expect(rect.top).toBe(50);
		expect(rect.bottom).toBe(50);
		expect(rect.left).toBe(5);
		expect(rect.right).toBe(5);
	});

  it("should return a simple middle for applyValueToNewRatio", function() {
		var actual = Graphy.util.applyValueToNewRatio(5, 0, 10, 0, 100);
    expect(actual).toBe(50);
  });

	it("should return a negative middle for applyValueToNewRatio", function() {
		var actual = Graphy.util.applyValueToNewRatio(5, 0, 10, 0, -100);
    expect(actual).toBe(-50);
  });

	it("should return a ceiling for applyValueToNewRatio", function() {
		var actual = Graphy.util.applyValueToNewRatio(10, 0, 10, 0, 100);
    expect(actual).toBe(100);
  });

	it("should return a floor for applyValueToNewRatio", function() {
		var actual = Graphy.util.applyValueToNewRatio(0, 0, 10, 0, 100);
    expect(actual).toBe(0);
  });

	it("should return a quarter for applyValueToNewRatio", function() {
		var actual = Graphy.util.applyValueToNewRatio(2.5, 0, 10, 0, 100);
    expect(actual).toBe(25);
  });

	it("should find a function using functionByNameOrFunction", function() {
		var o = { 
			func: function() {}
		}
		var actual = Graphy.util.functionByNameOrFunction("func", o);
		expect(actual).toBe(o.func);
  });

});
