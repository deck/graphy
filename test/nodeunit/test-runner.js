// Run via phantomJS

var page = require('webpage').create();
page.settings.userAgent = 'phantom';

var runners = [
	{ url: 'http://localhost:7357/test/sanity/run.html', title: 'Sanity Tests' },
	{ url: 'http://localhost:7357/test/regression/run.html', title: 'Regression Tests' }
]

var openNextRunner = function() {
	if (runners.length == 0) { phantom.exit(); }
	
	var runner = runners.shift();
	console.log("*** " + runner.title + " ***");
	
	page.open(runner.url, function (status) {
		if (status == "fail") { 
			console.log("Status: " + status);
			phantom.exit(8); 
		}
	});
}

page.onConsoleMessage = function (msg) {
	if (msg == "HELLO PHANTOM: Tests Failed.") {
		phantom.exit(1);
	} else if (msg == "HELLO PHANTOM: Tests Successful.") {
		console.log("");
		openNextRunner();
	} else {
		console.log(msg); 
	}
}

openNextRunner();