#!/usr/bin/env node
var program = require('commander');
var expect = require('chai').expect;
var spamUrl = require('../spam-url');

var HTTP_METHODS = /^(GET|POST|HEAD|PUT|DELETE)$/i;

program
  .version('0.2.3')
  .option('-u --url <u>', 'request URL to spam')
  .option('-m --method <m>', 'HTTP method (default: POST)', HTTP_METHODS, 'POST')
  .option('-i --interval <i>', 'request interval in ms (default: 1000)', parseInt)
  .option('-f --file <f>', 'an array of JSON request bodies')
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

