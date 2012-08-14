//
// Code sliced and mangled from nodeunit/lib/reporters/default.js
//
nodeunit.phantomRun = function(modules, options, callback) {

	var util = {
		inspect: function(obj, showHidden, depth) { 
			// TODO: We should port this function from node.js
			return obj.toString();
		}
	}
	
	// this bit comes for nodeuit/lib/utils.js
	var utils = {
		betterErrors: function(assertion) {
			if (!assertion.error) return assertion;

			var e = assertion.error;
			if (e.actual && e.expected) {
				var actual = util.inspect(e.actual, false, 10).replace(/\n$/, '');
				var expected = util.inspect(e.expected, false, 10).replace(/\n$/, '');
				var multiline = (
				actual.indexOf('\n') !== -1 || expected.indexOf('\n') !== -1);
				var spacing = (multiline ? '\n' : ' ');
				e._message = e.message;
				e.stack = (
				e.name + ':' + spacing + actual + spacing + e.operator + spacing + expected + '\n' + e.stack.split('\n').slice(1).join('\n'));
			}
			return assertion;
		}
	}

	var prefixesAndSuffixes = {
		"error_prefix": "\u001B[31m",
		"error_suffix": "\u001B[39m",
		"ok_prefix": "\u001B[32m",
		"ok_suffix": "\u001B[39m",
		"bold_prefix": "\u001B[1m",
		"bold_suffix": "\u001B[22m",
		"assertion_prefix": "\u001B[35m",
		"assertion_suffix": "\u001B[39m"
	};

	var error = function(str) {
			return prefixesAndSuffixes.error_prefix + str + prefixesAndSuffixes.error_suffix;
		};
	var ok = function(str) {
			return prefixesAndSuffixes.ok_prefix + str + prefixesAndSuffixes.ok_suffix;
		};
	var bold = function(str) {
			return prefixesAndSuffixes.bold_prefix + str + prefixesAndSuffixes.bold_suffix;
		};
	var assertion_message = function(str) {
			return prefixesAndSuffixes.assertion_prefix + str + prefixesAndSuffixes.assertion_suffix;
		};

	var start = new Date().getTime();

	nodeunit.runModules(modules, {
		moduleStart: function(name) {
			console.log('\n' + bold(name));
		},
		testDone: function(name, assertions) {
			if (!assertions.failures()) {
				console.log('\u2713 ' + name);
			} else {
				console.log(error('\u2718 ' + name) + '\n');
				assertions.forEach(function(a) {
					if (a.failed()) {
						a = utils.betterErrors(a);
						if (a.error instanceof nodeunit.assert.AssertionError && a.message) {
							console.log('Assertion Message: ' + assertion_message(a.message));
						}
						console.log(a.error.stack + '\n');
					}
				});
			}
		},
		done: function(assertions, end) {
			var end = end || new Date().getTime();
			var duration = end - start;
			if (assertions.failures()) {
				console.log('\n' + bold(error('FAILURES: ')) + assertions.failures() + '/' + assertions.length + ' assertions failed (' + assertions.duration + 'ms)');
			} else {
				console.log('\n' + bold(ok('OK: ')) + assertions.length + ' assertions (' + assertions.duration + 'ms)');
			}

			if (callback) callback(assertions.failures() ? new Error('We have got test failures.') : undefined);
		},
		testStart: function(name) {}
	});
}

nodeunit.go = function(suites) {
	if (navigator.userAgent == "phantom" ) {
		nodeunit.run = nodeunit.reporter.run = nodeunit.phantomRun;
	}

	nodeunit.run(
		suites, 
		{}, 
		function(failError) { 
			failError ? console.log("HELLO PHANTOM: Tests Failed.") : console.log("HELLO PHANTOM: Tests Successful.");
		}
	);
}
