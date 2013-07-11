#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var restler = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://sheltered-plateau-5715.herokuapp.com/"

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
  return doChecks(cheerioHtmlFile(htmlfile), checksfile);
};

var checkURL = function(url, checksfile) {
  restler.get(url).on('complete', function(result, response) {
    var outJson;

    if(result instanceof Error) {
      console.log("%s does not exist. Exiting.", url);
      process.exit(1);
    }
    
    outJson = buildJson(doChecks(response.rawEncoded, checksfile));

    console.log(outJson);
  });
}

var doChecks = function(contents, checksfile) {
  $ = cheerio.load(contents);
  var checks = loadChecks(checksfile).sort();
  var out = {};
  for(var ii in checks) {
      var present = $(checks[ii]).length > 0;
      out[checks[ii]] = present;
  }
  return out;
}

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var buildJson = function(data) {
  return JSON.stringify(data, null, 4);
}

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'URL of html file')
        .parse(process.argv);

    if(program.url) {
      checkURL(program.url, program.checks);
    } else {
      console.log(buildJson(checkHtmlFile(program.file, program.checks)));
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}