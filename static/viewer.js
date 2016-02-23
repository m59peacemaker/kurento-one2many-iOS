var ws = new WebSocket('wss://' + location.host + '/one2many')

var video = document.createElement('video')
video.autoplay = true
document.body.appendChild(video)

var webRtcPeer

ws.addEventListener('open', viewer)

ws.addEventListener('message', function(message) {
  var msg = JSON.parse(message.data)
  switch (msg.id) {
    case 'viewerResponse':
      webRtcPeer.processAnswer(msg.sdpAnswer)
      break
    case 'iceCandidate':
      webRtcPeer.addIceCandidate(msg.candidate)
      break
  }
})

function viewer() {
  webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly({
    remoteVideo: video,
    onicecandidate: function onIceCandidate(candidate) {
      sendMessage({
        id : 'onIceCandidate',
        candidate : candidate
      })
    }
  }, function(err) {
    this.generateOffer(function (err, offerSdp) {
      sendMessage({
        id: 'viewer',
        sdpOffer: offerSdp
      })
    })
  })
}

function sendMessage(message) {
  ws.send(JSON.stringify(message))
}
