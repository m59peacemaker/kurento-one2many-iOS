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

ws.addEventListener('open', viewer)

ws.onmessage = function(message) {
  var parsedMessage = JSON.parse(message.data)
  switch (parsedMessage.id) {
    case 'viewerResponse':
      viewerResponse(parsedMessage)
      break
    case 'iceCandidate':
      queue.push(parsedMessage.candidate)
      if (ready) {
        sendQueue()
      }
      break
  }
}

function sendMessage(message) {
  var jsonMessage = JSON.stringify(message)
  ws.send(jsonMessage)
}

function error(err) {
  throw err
}

function viewer() {
  pc = new RTCPeerConnection()
  pc.addEventListener('icecandidate', function(event) {
    if (event.candidate) {
      sendMessage({
        id: 'onIceCandidate',
        candidate: event.candidate
      })
    }
  })

  createOffer(pc, {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
  }).then(function(offer) {
    sendMessage({
      id : 'viewer',
      sdpOffer : offer.sdp
    })
  })
}

function viewerResponse(msg) {
  pc.setRemoteDescription(new RTCSessionDescription({
    type: 'answer',
    sdp: msg.sdpAnswer
  }), function () {
    sendQueue()
    ready = true
    var stream = pc.getRemoteStreams()[0]
    var url = URL.createObjectURL(stream)
    vid.src = url
  }, error)
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
