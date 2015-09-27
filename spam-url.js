var http = require('http');
var url = require('url');
var expect = require('chai').expect;
var fs = require('fs');
var Console = require('console');
var Promise = require('bluebird');

var parseJSON = JSON.parse.bind(JSON);

module.exports = function main(options) {

  if (options.url) {
    expect(options.port).to.not.be.ok;
    expect(options.path).to.not.be.ok;
    expect(options.host).to.not.be.ok;
    var URL = url.parse(options.url);
    options.port = URL.port;
    options.path = URL.path;
    options.host = URL.host;
  }

  expect(options.host).to.be.ok;
  expect(options.method).to.be.ok;
  expect(options.path).to.be.ok;
  expect(options.interval).to.be.ok;
  expect(options.input).to.be.ok;
  expect(options.input.file || options.input.stream).to.be.ok;
  expect(options.output).to.be.ok;
  expect(options.output.file || options.output.stream).to.be.ok;

  var outputStream = options.output.file 
    ? fs.createWriteStream(options.output.file)
    : options.output.stream;

  var inputStream = options.input.file
    ? fs.createReadStream(options.input.file)
    : options.input.stream;

  return loadDataFrom(inputStream)
    .then(parseJSON)
    .then(checkIfArray)
    .then(sendRequestsTo(
      options.host, 
      options.method, 
      options.port, 
      options.path, 
      options.interval,
      outputStream
    ));
}

function loadDataFrom(stream) {
  return new Promise(function(fullfill, reject) {
    var input = stream;
    var data = '';
    input.setEncoding('utf8');
    input.on('data', _data => data += _data);
    input.on('error', reject);
    input.on('end', function(){
      fullfill(data);
    });
  });
}

function checkIfArray(objects) {
  expect(objects).to.be.an.instanceof(Array);
  return objects;
}

function sendRequestsTo(HOST, METHOD, PORT, PATH, INTERVAL, OUTPUT) {

  var counter = 0;
  var time = Date.now();

  return function sendRequest(objects) {
    if (! objects.length) {
      return Promise.resolve();
    }

    return new Promise(function(fullfill, reject) {
      var serialized = JSON.stringify(objects[0]);
      
      var options = {
        host: HOST,
        method: METHOD,
        port: PORT,
        path: PATH,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': serialized.length
        }
      };

      var $request = http.request(options);

      $request.on('response', handle);
      $request.on('error', reject);
      $request.write(serialized);
      $request.end();
      
      function handle(response) {
        loadDataFrom(response)
          .then((data) => {

            var log = {
              id: counter++,
              timeTaken: Date.now() - time,
              request: {
                body: serialized,
                options: options
              },
              response: {
                body: data,
                headers: response.headers,
              }
            };

            // write request body
            log.request.body = serialized;

            // update time 
            time = log.timeTaken + time;

            // save log
            OUTPUT.write(JSON.stringify(log, null, 2) + '\n');

          })
          .catch(reject)
          .then(function(){
            // recurse
            var rest = objects.slice(1, objects.length);
            setTimeout(fullfill, INTERVAL, rest);
          });
      }

    })
    .then(sendRequest);

  };

}
