var express          = require('express');
var http             = require('http');
var Promise          = require('bluebird');
var kurento          = require('app/kurento-client');
var config           = require('app/config');
var setupBroadcaster = require('app/sockets/broadcaster');
var setupViewer      = require('app/sockets/viewer');

var app = express();

var server = http.createServer(app);

// CORS, switch to npm cors
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.options('*', function(req, res) {
  // send 200 OK on options requests
  res.end();
});

require('app/routes/broadcasts')(app);

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
