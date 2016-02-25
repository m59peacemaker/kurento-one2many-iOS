var React  = require('react');

module.exports = React.createClass({
  componentWillMount: function() {
    console.log(this);
  },
  render: function() {
    return (<div>
      <h1>Broadcast ID: {this.state.broadcastId}</h1>
      <video></video>
    </div>)
  }
});
/*
  var socket = io(config.wsServer+'/viewer');

  pc = new RTCPeerConnection(null);

  pc.addEventListener('icecandidate', function(event) {
    if (event.candidate) {
      socket.emit('onIceCandidate', {
        candidate: event.candidate
      });
    }
  });

  createOffer(pc, {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
  }).then(function(offer) {
    socket.emit('view-offer', {
      sdp : offer.sdp
    }, function(err, msg) {
      if (err) { return console.log('View offer error.', err); }
      pc.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: msg.sdp
      }), function() {
        var stream = pc.getRemoteStreams()[0];
        var url = URL.createObjectURL(stream);
        video.src = url
        console.log('Remote URL:', url)
      }, function(err) {
        console.log(err);
      });
    });
  });
*/
