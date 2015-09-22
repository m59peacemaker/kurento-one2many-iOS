var kurento        = require('kurento-client');
var Promise        = require('bluebird');
var config         = require('app/config');
var bcmgr          = require('app/broadcasts/manager');
var makeSaveDir    = require('app/broadcasts/makeDir');
var toMp4          = require('app/broadcasts/toMp4');
var recordFormat   = config.video.format.record;
var playbackFormat = config.video.format.playback;
var uuid           = require('uuid-v4');

module.exports = function(io, client) {

  var nsp = io.of('/broadcaster');
  nsp.on('connection', function(socket) {

    socket.on('broadcast-offer', function(msg, cb) {

      // if (!sessionToken) {

      var broadcast = {
        socket: socket,
        id: uuid(),
        sessionToken: msg.sessionToken
      };

      isAuth(broadcast.sessionToken).then(function(auth) {
        // if (!auth) { throw
        return client.createAsync('MediaPipeline');
      }).then(function(pipeline) {
        Promise.promisifyAll(pipeline);
        broadcast.pipeline = pipeline;
        socket.once('disconnect', broadcastEnd);
        socket.once('error', broadcastEnd);
        return makeSaveDir(broadcast.id);
      }).then(function(savePath) {
        broadcast.file = savePath+'/'+broadcast.id+'.'+recordFormat;
        return broadcast.pipeline.createAsync('RecorderEndpoint', {
          mediaProfile: recordFormat.toUpperCase(),
          uri: 'file://'+broadcast.file
        });
      }).then(function(recorderEndpoint) {
        Promise.promisifyAll(recorderEndpoint);
        broadcast.recorderEndpoint = recorderEndpoint;
        return broadcast.pipeline.createAsync('WebRtcEndpoint');
      }).then(function(webRtcEndpoint) {
        Promise.promisifyAll(webRtcEndpoint);
        broadcast.webRtcEndpoint = webRtcEndpoint;
        webRtcEndpoint.on('OnIceCandidate', function(event) {
          var candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
          socket.emit('broadcast-icecandidate', {
            candidate: candidate,
            broadcastId: broadcast.id
          });
        });
        return Promise.all([
          webRtcEndpoint.processOfferAsync(msg.offer),
          webRtcEndpoint.gatherCandidatesAsync()
        ]);
      }).spread(function(answer) {
        return Promise.all([
          answer,
          broadcast.webRtcEndpoint.connectAsync(broadcast.recorderEndpoint)
        ]);
      }).spread(function(answer) {
        bcmgr.addIdle(broadcast);
        cb(null, answer);
      }).catch(function(err) {
        cb(err);
      });
    });

    socket.on('broadcast-begin', function(msg, cb) {
      var broadcast = bcmgr.getBroadcast();
      return broadcast.recorderEndpoint.recordAsync().asCallback(cb);
    });

    socket.on('broadcast-icecandidate', function(msg) {
      var broadcast = bcmgr.getBroadcast(msg.broadcastId);
      var candidate = kurento.register.complexTypes.IceCandidate(msg.candidate);
      broadcast.webRtcEndpoint.addIceCandidate(candidate);
    });

    socket.on('broadcast-end', function(msg, cb) {
      broadcastEnd().asCallback(cb);
    });


    function broadcastEnd(id) {
      var broadcast = bcmgr.getBroadcast(id);
      if (!broadcast || !broadcast.pipeline) {
        return Promise.resolve();
      }
      io.of('viewer').emit('view-end');
      return broadcast.pipeline.releaseAsync().then(function() {
        if (recordFormat !== 'mp4' && playbackFormat === 'mp4') {
          return toMp4Async(broadcast.file).then(function() {
            fs.unlink(broadcast.file); // delete old file
          });
        }
        bcmgr.setBroadcast(null);
      });
    }

  });

};
