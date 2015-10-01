#!/usr/bin/env node
var program = require('commander');
var expect = require('chai').expect;
var spamUrl = require('../spam-url');

var HTTP_METHODS = /^(GET|POST|HEAD|PUT|DELETE)$/i;

program
  .version('0.2.3')
  .option('-u --url <u>', 'Request URL to spam')
  .option('-m --method <m>', 'HTTP method', HTTP_METHODS, 'GET')
  .option('-i --interval <i>', 'Request Interval (ms)', parseInt)
  .option('-f --file <f>', 'Request Body (containing JSON array)')
  .parse(process.argv);

var options = {
  url: program.url,
  method: program.method,
  interval: program.interval || 1000,
  input: {
    file: program.file,
    stream: process.stdin
  },
  output: {
    stream: process.stdout
  }
}

if (! options.url) {
  throw new Error('URL required, please see help. (--help)');
}

spamUrl(options)
  .catch(function(error) {
    console.error(error)
  });

