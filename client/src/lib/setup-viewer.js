import Viewer from './viewer'

const setupViewer = () => {

  var vid = document.createElement('video')
  vid.autoplay = true
  document.body.appendChild(vid)

  const error = err => {
    console.log(err)
    alert(JSON.stringify(err))
  }

  const ws = new WebSocket(`wss://api.${location.host}/one2many`)
  ws.addEventListener('error', error)

  ws.addEventListener('open', () => {
    const viewer = new Viewer()
    ws.onmessage = message => {
      const msg = JSON.parse(message.data)
      switch (msg.id) {
        case 'viewerResponse':
          viewer.emit('answer', msg.sdpAnswer)
          return
        case 'iceCandidate':
          viewer.emit('icecandidate-remote', msg.candidate)
          return
      }
    }
    viewer.on('error', error)
    viewer.on('stream', stream => vid.srcObject = stream)
    viewer.on('offer', offer => {
      ws.send(JSON.stringify({
        id: 'viewer',
        sdpOffer: offer.sdp
      }))
    })
    viewer.on('icecandidate', candidate => {
      ws.send(JSON.stringify({
        id: 'onIceCandidate',
        candidate: candidate
      }))
    })
  })
}

export default setupViewer
