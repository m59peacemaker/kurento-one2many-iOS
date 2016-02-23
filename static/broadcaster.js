var ws = new WebSocket('wss://' + location.host + '/one2many')

var video = document.createElement('video')
video.autoplay = true
document.body.appendChild(video)

var webRtcPeer = null

ws.addEventListener('open', presenter)

ws.addEventListener('message', function(message) {
  var msg = JSON.parse(message.data)
  switch (msg.id) {
    case 'presenterResponse':
      webRtcPeer.processAnswer(msg.sdpAnswer)
      break
    case 'iceCandidate':
      webRtcPeer.addIceCandidate(msg.candidate)
      break
  }
})

function presenter() {
  webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly({
    localVideo: video,
    onicecandidate : function(candidate) {
      sendMessage({
        id: 'onIceCandidate',
        candidate: candidate
      })
    }
  }, function(err) {
    this.generateOffer(function(err, offerSdp) {
      sendMessage({
        id: 'presenter',
        sdpOffer: offerSdp
      })
    })
  })
}

function sendMessage(message) {
  ws.send(JSON.stringify(message))
}
