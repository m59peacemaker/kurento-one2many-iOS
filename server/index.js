var kurento          = require('kurento-client');
var http             = require('http');
var Promise          = require('bluebird');
var config           = require('app/config');
var setupBroadcaster = require('./lib/setup-broadcaster');
var setupViewer      = require('./lib/setup-viewer');


var server = http.createServer(function(req, res) {
  res.end('Hello.');
});

var io  = require('socket.io')(server);

kurento(config.kmsUri, function(err, client) {
  if (err) { throw err; }
  Promise.promisifyAll(client);
  setupBroadcaster(io, client);
  setupViewer(io, client);
});

server.listen(port, function() {
  console.log('Listening on port: '+port);
});
