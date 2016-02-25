var React = require('react');
var {Link} = require('react-router');
var createOffer = require('app/create-offer');
var makeSocket = require('app/make-socket');
var freeIce    = require('freeice');

// free ice makes the icecandidate count match working code, but may not matter (remove?)

module.exports = React.createClass({
  getInitialState: function() {
    return {
      broadcastReady: false,
      broadcastSrc: null
    };
  },
  componentWillMount: function() {
    var pc = new RTCPeerConnection({
      iceServers: [] //freeIce()
    });
    var socket = makeSocket('/viewer');

    var viewerId;
    var candidates = [];
    pc.addEventListener('icecandidate', function(event) {
      if (event.candidate) {
        if (viewerId) {
          console.log('sending candidate');
          sendCandidate(event.candidate);
        } else {
          console.log('queueing candidate');
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
        candidate: candidate
      });
    }

    connect(pc, socket, this.props.params.id).then(msg => {
      sendCandidates();
      var stream = pc.getRemoteStreams()[0];
      var src = URL.createObjectURL(stream);
      viewerId = msg.viewerId;
      this.setState({
        broadcastReady: true,
        broadcastSrc: src
      });
      console.log('Remote URL:', src)
    });
  },
  render: function() {
    var {state, props} = this;
    return (<div>
      <Link to="home">Home</Link>
      <h1>Broadcast ID: {props.params.id}</h1>
      <p>{state.broadcastReady} {state.broadcastSrc}</p>
      {state.broadcastReady ? <video autoPlay src={state.broadcastSrc}></video> : null}
    </div>)
  }
});

function connect(pc, socket, broadcastId) {
  socket.on('icecandidate', function(candidate) {
    console.log('icecandidate from server');
    pc.addIceCandidate(new RTCIceCandidate(candidate));
  });
  return new Promise(function(resolve, reject) {
    createOffer(pc, {
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
      DtlsSrtpKeyAgreement: true
      //optional: [{
      //  DtlsSrtpKeyAgreement: true
      //}]
    }).then(offer => {
      console.log('set local offer', offer.sdp);
      socket.emit('offer', {
        broadcastId: broadcastId,
        offerSdp: offer.sdp
      }, function(err, msg) {
        if (err) { console.log(err); throw err; }
        console.log('offer accepted');
        console.log('remote description', msg.answerSdp);
        pc.setRemoteDescription(new RTCSessionDescription({
          type: 'answer',
          sdp: msg.answerSdp
        }), function() {
          resolve(msg);
        }, reject);
      });
    });
  });
}
