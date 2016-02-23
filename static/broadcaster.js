var ws = new WebSocket('wss://' + location.host + '/one2many')

var vid = document.createElement('video')
vid.autoplay = true
document.body.appendChild(vid)
var pc = null
var queue = []
var ready = false

function sendQueue() {
  queue = queue.filter(function(candidate) {
    pc.addIceCandidate(new RTCIceCandidate(candidate))
  })
}

ws.onmessage = function(message) {
  var msg = JSON.parse(message.data)
  switch (msg.id) {
    case 'presenterResponse':
      pc.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: msg.sdpAnswer
      }), function() {
        sendQueue()
        ready = true
      })
      break
    case 'iceCandidate':
      queue.push(msg.candidate)
      if (ready) {
        sendQueue()
      }
      break
  }
}

ws.addEventListener('open', presenter)

function error(err) {
  throw err
}

function presenter() {
  pc = new RTCPeerConnection()
  pc.addEventListener('icecandidate', function(event) {
    if (event.candidate) {
      sendMessage({
        id: 'onIceCandidate',
        candidate: event.candidate
      })
    }
  })
  navigator.getUserMedia({
    audio: true,
    video: true
  }, function(stream) {
    pc.addStream(stream)
    vid.muted = true
    vid.srcObject = stream
    createOffer(pc).then(function(offer) {
      sendMessage({
        id: 'presenter',
        sdpOffer: offer.sdp
      })
    })
  }, error)
}

function sendMessage(msg) {
  ws.send(JSON.stringify(msg))
}

function createOffer(pc, constraints) {
  return new Promise(function(resolve, reject) {
    pc.createOffer(function(offer) {
      pc.setLocalDescription(new RTCSessionDescription(offer), function() {
        resolve(offer)
      }, reject)
    }, reject, constraints)
  })
}
