var http = require('http');
var url = require('url');
var expect = require('chai').expect;
var fs = require('fs');
var Promise = require('bluebird');

var parseJSON = JSON.parse.bind(JSON);

module.exports = function main(options) {

  // rejected options
  expect(options.host).to.not.be.ok;

  if (options.url) {
    expect(options.url).to.match(/http(|s):\/\//);
    expect(options.port).to.not.be.ok;
    expect(options.path).to.not.be.ok;
    expect(options.hostname).to.not.be.ok;
    expect(options.protocol).to.not.be.ok;
    var URL = url.parse(options.url);
    options.protocol = URL.protocol;
    options.hostname = URL.hostname;
    options.port = URL.port;
    options.path = URL.path;
  }

  expect(options.method).to.be.ok;
  expect(options.protocol).to.be.ok;
  expect(options.hostname).to.be.ok;
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
      options.method,
      options.protocol,
      options.hostname,
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
    input.on('data', function(_data) { data += _data; });
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

function sendRequestsTo(
  METHOD, PROTOCOL, HOSTNAME, PORT, PATH, INTERVAL, OUTPUT
) {

  var counter = 0;
  var time = Date.now();

  return function sendRequest(objects) {
    return new Promise(function(fullfill, reject) {
      if (! objects.length) {
        return fullfill(objects);
      }

      var serialized = JSON.stringify(objects[0]);

      var options = {
        protocol: PROTOCOL,
        host: HOSTNAME,
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
          .then((body) => {
            /*
             *  Take the body and construct a log object to write to
             *  output stream.
             */

            var log = {
              id: counter++,
              timeTaken: Date.now() - time,
              request: {
                body: serialized,
                options: options,
              },
              response: {
                body: body,
                headers: response.headers,
                status: response.statusCode,
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
          .then(function (){

            // recurse, slightly redundantly
            var rest = objects.slice(1, objects.length);
            setTimeout(fullfill, rest.length ? INTERVAL : 0, rest);

          });
      }

    })
    .then(function(rest) {
      if (rest.length) {
        return sendRequest(rest);
      }
    });
  };

}
