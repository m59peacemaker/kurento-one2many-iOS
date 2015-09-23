var config = require('./config');
var io = require('socket.io-client');
var device = require('app/device');

var vid = document.getElementById('video');
vid.muted = true;

device.ready().then(function() {
  if (device.is('iOS')) {
    cordova.plugins.iosrtc.debug.enable('iosrtc*');
    cordova.plugins.iosrtc.registerGlobals();
  }
  foo();
});

function getCameraIds() {
  return navigator.mediaDevices.enumerateDevices().then(function(devices) {
    return devices.filter(function(device) {
      return device.kind === 'videoinput' || device.kind === 'video' ? device.deviceId : null;
    }).map(function(camera) {
      return camera.deviceId;
    });
  });
}

function foo() {
  getCameraIds().then(function(cameras) {
    navigator.getUserMedia({
      audio: true,
      video: {
        mandatory: {
          sourceId: cameras[1] ? cameras[1] : cameras[0]
        }
      }
    }, function(stream) {
      vid.srcObject = stream;
      vid.load();
      vid.play();
    }, function(err) {
      console.log(err);
    });
  });
}

function stuff() {

  var pc;
  var socket = io(config.wsServer);

  window.onbeforeunload = function() {
    socket.close();
  }

  var queue = [];
  var ready = false;

  socket.on('presenterResponse', presenterResponse);
  socket.on('viewerResponse', viewerResponse);
  socket.on('stopCommunication', dispose);
  socket.on('iceCandidate', function(msg) {
    queue.push(msg.candidate);
    if (ready) {
      sendQueue();
    }
  });

  function sendQueue() {
    queue = queue.filter(function(candidate) {
      pc.addIceCandidate(new RTCIceCandidate(candidate));
    });
  }

  function presenterResponse(msg) {
    if (msg.response !== 'accepted') { return error(msg); }
    if (pc.signalingState === 'closed') {
      return error('PeerConnection is closed');
    }
    pc.setRemoteDescription(new RTCSessionDescription({
      type: 'answer',
      sdp: msg.sdpAnswer
    }), function() {
      sendQueue();
      ready = true;
    });
  }


  function presenter() {
    if (!pc) {
      pc = new RTCPeerConnection();
      pc.addEventListener(function(event) {
        if (event.candidate) {
          socket.emit('onIceCandidate', {
            candidate: event.candidate
          });
        }
      });
      navigator.getUserMedia({
        audio: true,
        video: true
      }, function(stream) {
        pc.addStream(stream);
        vid.muted = true;
        vid.srcObject = stream;
        pc.createOffer(function(offer) {
          pc.setLocalDescription(new RTCSessionDescription(offer), function() {
            socket.emit('presenter', {
              offer: offer.sdp
            });
          }, error);
        }, error);
      }, error);
    }
  }

  function viewer() {
    if (pc) { return; }

    pc = new RTCPeerConnection();
    pc.addEventListener('icecandidate', function(event) {
      console.log(event);
      if (event.candidate) {
        socket.emit('onIceCandidate', {
          candidate: event.candidate
        });
      }
    });

    /*deviceReady().then(function() {
      if (isDevice('iOS')) {
        options.connectionConstraints = {
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        };
      }*/

    pc.createOffer(function(offer) {
      pc.setLocalDescription(new RTCSessionDescription(offer), function() {
        socket.emit('viewer', {
          offer : offer.sdp
        });
      }, error);
    }, error, {
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
  }

  function viewerResponse(msg) {
    if (msg.response !== 'accepted') { return dispose(); }
    pc.setRemoteDescription(new RTCSessionDescription({
      type: 'answer',
      sdp: msg.sdpAnswer
    }), function () {
      sendQueue();
      ready = true;
      var stream = pc.getRemoteStreams()[0];
      var url = URL.createObjectURL(stream);
      vid.src = url
      console.log('Remote URL:', url)
    }, function(err) {
      console.log(err);
    });
  }

  function stop() {
    if (!pc) { return; }
    sendMessage({id: 'stop'});
    dispose();
  }

  function error(msg) {
    console.log('ERROR!', msg);
    dispose();
  }

  function dispose() {
    if (pc) {
      pc.close();
      pc = null;
    }
  }

}
