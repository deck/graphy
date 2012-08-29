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
