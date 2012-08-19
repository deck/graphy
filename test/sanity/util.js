this.utilSanity = {
	'simple middle for applyValueToNewRatio': function (test) {
		var actual = Graphy.util.applyValueToNewRatio(5, 0, 10, 0, 100);
		assert.equal(actual, 50);
		test.done();
	},
	
	'negative middle for applyValueToNewRatio': function (test) {
		var actual = Graphy.util.applyValueToNewRatio(5, 0, 10, 0, -100);
		assert.equal(actual, -50);
		test.done();
	},
	
	'ceiling for applyValueToNewRatio': function (test) {
		var actual = Graphy.util.applyValueToNewRatio(10, 0, 10, 0, 100);
		assert.equal(actual, 100);
		test.done();
	},
	
	'floor for applyValueToNewRatio': function (test) {
		var actual = Graphy.util.applyValueToNewRatio(0, 0, 10, 0, 100);
		assert.equal(actual, 0);
		test.done();
	},
	
	'quarter for applyValueToNewRatio': function (test) {
		var actual = Graphy.util.applyValueToNewRatio(2.5, 0, 10, 0, 100);
		assert.equal(actual, 25);
		test.done();
	},
	
	'function functionByNameOrFunction': function(test) {
		var o = { 
			func: function() {}
		}
		var actual = Graphy.util.functionByNameOrFunction("func", o);
		
		assert.strictEqual(actual, o.func);
		
		test.done();
	}
};
