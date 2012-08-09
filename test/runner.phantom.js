var page = require('webpage').create();

page.onLoadFinished = function (status) {
  // do something
	console.log(status);
	//phantom.exit();
};


page.open('test/runner.html');