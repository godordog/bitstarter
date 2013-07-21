#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var sys = require('util');

var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var CHECKSURL_DEFAULT = "google.com";

var assertFileExists = function(infile){
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1);
    }
    return instr;
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
}

var cheerioHtmlFile = function(htmlfile){
    return cheerio.load(fs.readFileSync(htmlfile));
};

var checkHtmlFile = function(htmlfile, checksfile){
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks){
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn){
    return fn.bind({});
};

if(require.main == module){
    program
    .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
    .option('-f, --file <html_file>','Path to index.html',clone(assertFileExists), HTMLFILE_DEFAULT)
    .option('-u, --url <url>','URL')//, assertURLExists, CHECKSURL_DEFAULT)
    .parse(process.argv);
	if (program.url != null) { // URL
		rest.get(program.url).on('complete', function(result){
		if (result instanceof Error) {
			sys.puts('Error: ' + result.message);
			this.retry(5000); // try again after 5 sec
		} else {
		    // sys.puts(result);
		    fs.writeFileSync('url_file.html', result);
		    var checkJson = checkHtmlFile('url_file.html', program.checks);
		    var outJson = JSON.stringify(checkJson, null, 4);
		    console.log(outJson);
		} 
	});
	} else { // file
		var checkJson = checkHtmlFile(program.file, program.checks);
		var outJson = JSON.stringify(checkJson, null, 4);
		console.log(outJson);
	}
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
