var kurento          = require('app/kurento-client');
var http             = require('http');
var Promise          = require('bluebird');
var config           = require('app/config');
var setupBroadcaster = require('app/sockets/broadcaster');
var setupViewer      = require('app/sockets/viewer');

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

server.listen(config.port, function() {
  console.log('Listening on port: '+config.port);
});
