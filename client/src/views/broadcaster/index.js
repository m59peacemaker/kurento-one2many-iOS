var React = require('react');
var {Link, Navigation} = require('react-router');
var getCameraIds = require('app/get-camera-ids');
var createOffer = require('app/create-offer');
var makeSocket = require('app/make-socket');
var freeIce    = require('freeice');

module.exports = React.createClass({
  mixins: [Navigation],
  getInitialState: function() {
    return {
      broadcastId: null,
      broadcasting: false,
      broadcastReady: false,
      videoSrc: null
    };
  },
  componentWillMount: function() {
    var socket = makeSocket('/broadcaster');
    var pc = new RTCPeerConnection({
      iceServers: freeIce()
    });
    var broadcastId;
    var sessionToken = 1;

    this.setState({
      socket: socket,
      pc: pc
    });

    var candidates = [];
    pc.addEventListener('icecandidate', function(event) {
      if (event.candidate) {
        if (broadcastId) {
          console.log('sending candidate');
          sendCandidate(event.candidate);
        } else {
          console.log('queuing candidate');
          candidates.push(event.candidate);
        }
      }
    });

    function sendCandidates() {
      console.log('sending queue');
      candidates = candidates.filter(sendCandidate);
    }

    function sendCandidate(candidate) {
      socket.emit('icecandidate', {
        broadcastId: broadcastId,
        candidate: candidate
      });
    }

    getCameraIds().then((cameras) => {
      var cameraId = cameras[1] ? cameras[1] : cameras[0];
      return getUserMedia({
        audio: true,
        video: true,
        optional: [{sourceId: cameraId}]
      });
    }).then((stream) => {
      pc.addStream(stream);
      var src = URL.createObjectURL(stream);
      this.setState({
        videoSrc: src
      });
      return connect(pc, socket, sessionToken);
    }).then(msg => {
      console.log('broadcast accepted');
      broadcastId = msg.broadcastId
      sendCandidates();
      this.setState({
        broadcastId: msg.broadcastId,
        broadcastReady: true
      });
    });
  },
  record: function() {
    this.state.socket.emit('begin', {
      broadcastId: this.state.broadcastId,
      sessionToken: 1
    }, () => {
      this.setState({
        broadcasting: true
      });
    });
  },
  render: function() {
    var state = this.state;
    return (<div>
      {state.broadcastId && state.broadcasting ? <h1>Broadcast ID: <Link target="_blank" to="broadcast" params={{id: state.broadcastId}}>{state.broadcastId}</Link></h1> : null}
      {state.videoSrc ? <video autoPlay muted src={state.videoSrc}></video> : null}
      {state.broadcasting ? <Link to="home">Cancel</Link> : null}
      {state.broadcastReady && !state.broadcasting ? <button onClick={this.record}>Record</button> : null}
    </div>)
  }
});

function getUserMedia(constraints) {
  return new Promise(function(resolve, reject) {
    navigator.getUserMedia(constraints, resolve, reject);
  });
}

function connect(pc, socket, sessionToken) {
  socket.on('icecandidate', function(msg) {
    console.log('icecandidate from server to pc');
    console.log(msg.candidate)
    pc.addIceCandidate(new RTCIceCandidate(JSON.stringify(msg.candidate)));
  });
  return new Promise(function(resolve, reject) {
    createOffer(pc, {
      DtlsSrtpKeyAgreement: true
      //optional: [{
      //  DtlsSrtpKeyAgreement: true
      //}]
    }).then(offer => {
      socket.emit('offer', {
        offerSdp: offer.sdp,
        sessionToken: sessionToken
      }, function(err, msg) {
        if (err) { console.log(err); throw err; }
        console.log('setting remote description');
        pc.setRemoteDescription(new RTCSessionDescription({
          type: 'answer',
          sdp: msg.answerSdp
        }), function() {
          resolve(msg);
        }, reject);
      })
    });
  });
}
