this.intervalSanity = {
	
	'floor to the 1st of the month': function (test) {
		var date = new Date(2012, 8, 17, 3, 22, 12);
		var flooredDate = Graphy.interval.floor(date, Graphy.interval.month);
		var expectedFlooredDate = new Date(2012, 8, 1, 0, 0, 0, 0);
		
		assert.equal(flooredDate.getTime(), expectedFlooredDate.getTime());
		
		test.done();
	},
	
	'step to tomorrow': function (test) {
		var date = new Date(2012, 8, 17, 3, 22, 12);
		var steppedMS = Graphy.interval.stepDate(date, Graphy.interval.day);
		var expectedSteppedDate = new Date(2012, 8, 18, 0, 0, 0, 0);
		
		assert.equal(steppedMS, expectedSteppedDate.getTime());
		
		test.done();
	},
	
	"day is hour's next big thing": function (test) {
		var hour = Graphy.interval.hour;
		var day = Graphy.interval.day;
		
		assert.equal(Graphy.interval.biggerInterval(hour), day);
		
		test.done();
	}
	
};
