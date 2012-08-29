describe("Graphy.util", function() {

  it ("should return a simple middle for applyValueToNewRatio", function() {
		var actual = Graphy.util.applyValueToNewRatio(5, 0, 10, 0, 100);
    expect(actual).toBe(50);
  });

	it ("should return a negative middle for applyValueToNewRatio", function() {
		var actual = Graphy.util.applyValueToNewRatio(5, 0, 10, 0, -100);
    expect(actual).toBe(-50);
  });

	it ("should return a ceiling for applyValueToNewRatio", function() {
		var actual = Graphy.util.applyValueToNewRatio(10, 0, 10, 0, 100);
    expect(actual).toBe(100);
  });

	it ("should return a floor for applyValueToNewRatio", function() {
		var actual = Graphy.util.applyValueToNewRatio(0, 0, 10, 0, 100);
    expect(actual).toBe(0);
  });

	it ("should return a quarter for applyValueToNewRatio", function() {
		var actual = Graphy.util.applyValueToNewRatio(2.5, 0, 10, 0, 100);
    expect(actual).toBe(25);
  });

	it ("should find a function using functionByNameOrFunction", function() {
		var o = { 
			func: function() {}
		}
		var actual = Graphy.util.functionByNameOrFunction("func", o);
		expect(actual).toBe(o.func);
  });

});
