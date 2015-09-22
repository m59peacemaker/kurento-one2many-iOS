var config = require('./config');
var io = require('socket.io-client');
var React = require('react');
var device = require('app/device');

var stateRouter = require('app/router');

stateRouter.addState({
  name: 'home',
  route: '/',
  template: require('./states/home/index.js')
});
stateRouter.addState({
  name: 'broadcaster',
  route: '/broadcaster',
  template: require('./states/broadcaster/index.js')
});
stateRouter.addState({
  name: 'viewer',
  route: '/viewer',
  template: require('./states/viewer/index.js')
});
stateRouter.addState({
  name: 'nest-parent',
  route: '/nest-parent',
  template: require('./states/nest-parent/index.js')
});
stateRouter.addState({
  name: 'nest-parent.child-1',
  route: '/1/:foo',
  template: require('./states/nest-parent/child-1/index.js'),
});
stateRouter.addState({
  name: 'nest-parent.child-2',
  route: '/2',
  template: require('./states/nest-parent/child-2/index.js'),
  defaultChild: 'crazy-nest'
});
stateRouter.addState({
  name: 'nest-parent.child-2.crazy-nest',
  route: '/crazy',
  template: require('./states/nest-parent/child-2/crazy-nest/index.js')
});

stateRouter.evaluateCurrentRoute('home');


/*
device.ready().then(function() {
  if (device.is('iOS')) {
    cordova.plugins.iosrtc.registerGlobals();
  }
  Router.run(routes, function (Handler) {
    React.render(<Handler/>, document.body);
  });
});
*/
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

  function sendMessage(message) {
    var jsonMessage = JSON.stringify(message);
    ws.send(jsonMessage);
  }
}
