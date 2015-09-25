var http = require('http');
var program = require('commander');
var url = require('url');
var expect = require('chai').expect;
var fs = require('fs');

var HTTP_METHODS = /^(GET|POST|HEAD|PUT|DELETE)$/i;

program
  .version('0.0.0')
  .option('-u --url <u>', 'Request URL', url.parse)
  .option('-m --method <m>', 'HTTP method', HTTP_METHODS, 'GET')
  .option('-i --interval <i>', 'Request Interval', parseInt)
  .option('-f --file <f>', 'Request Body (JSON format)')
  .parse(process.argv);

var URL = program.url;
var METHOD = program.method;
var INTERVAL = program.interval || 1000;
var FILE = program.file;

expect(URL.host || URL.hostname).to.be.ok;

main();

function main() {
  return loadDataFrom(FILE, process.stdin)
    .then(checkIfArray)
    .then(sendRequestsTo(URL.host, METHOD, URL.port, URL.path, INTERVAL))
    .catch((error) => console.error(error));
}

function loadDataFrom(file, stream) {
  return new Promise(function(fullfill, reject) {
    var input = (file) ? fs.createReadStream(file) : stream;
    var data = '';
    input.setEncoding('utf8');
    input.on('data', _data => data += _data);
    input.on('error', reject);
    input.on('end', function(){
      try {
        fullfill(JSON.parse(data));
      } catch (exception) {
        reject(exception);
      }
    });
  });
}

function checkIfArray(objects) {
  expect(objects).to.be.an.instanceof(Array);
  return objects;
}

function sendRequestsTo(HOST, METHOD, PORT, PATH, INTERVAL) {

  var counter = 0;
  console.time('Request ' + counter);

  return function sendRequest(objects) {
    if (! objects.length) {
      return Promise.resolve(objects);
    }

    return new Promise(function(fullfill, reject) {
      var serialized = JSON.stringify(objects[0]);
      var $request = http.request({
        host: HOST,
        method: METHOD,
        port: PORT,
        path: PATH,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': serialized.length
        }
      });

      console.timeEnd('Request ' + counter);
      console.time('Request ' + ++counter);
      console.log('Sending: ', serialized);

      $request.write(serialized);
      $request.on('error', reject);
      $request.end(function(){
        var rest = objects.slice(1, objects.length);
        setTimeout(fullfill, INTERVAL, rest);
      });
    })
    .then(sendRequest);

  };

}
