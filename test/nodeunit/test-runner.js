// Run via phantomJS

var page = require('webpage').create();

page.settings.userAgent = 'phantom';

page.onConsoleMessage = function (msg) {
	if (msg == "HELLO PHANTOM: Tests Failed.") {
		phantom.exit(1);
	} else if (msg == "HELLO PHANTOM: Tests Successful.") {
		phantom.exit();
	} else {
		console.log(msg); 
	}
}

page.open('http://localhost:8374/test/sanity/run.html', function (status) {
	if (status == "fail") { 
		console.log("Status: " + status);
		phantom.exit(8); 
	}
});