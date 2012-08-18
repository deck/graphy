this.utilSanity = {
	'simple middle for apply_value_to_new_ratio': function (test) {
		var actual = Graphy.util.apply_value_to_new_ratio(5, 0, 10, 0, 100);
		assert.equal(actual, 50);
		test.done();
	},
	
	'negative middle for apply_value_to_new_ratio': function (test) {
		var actual = Graphy.util.apply_value_to_new_ratio(5, 0, 10, 0, -100);
		assert.equal(actual, -50);
		test.done();
	},
	
	'ceiling for apply_value_to_new_ratio': function (test) {
		var actual = Graphy.util.apply_value_to_new_ratio(10, 0, 10, 0, 100);
		assert.equal(actual, 100);
		test.done();
	},
	
	'floor for apply_value_to_new_ratio': function (test) {
		var actual = Graphy.util.apply_value_to_new_ratio(0, 0, 10, 0, 100);
		assert.equal(actual, 0);
		test.done();
	},
	
	'quarter for apply_value_to_new_ratio': function (test) {
		var actual = Graphy.util.apply_value_to_new_ratio(2.5, 0, 10, 0, 100);
		assert.equal(actual, 25);
		test.done();
	},
	
	'function_by_name_or_function': function(test) {
		var o = { 
			func: function() {}
		}
		var actual = Graphy.util.function_by_name_or_function("func", o);
		
		assert.strictEqual(actual, o.func);
		
		test.done();
	}
};
