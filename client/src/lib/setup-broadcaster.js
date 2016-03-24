import Broadcaster from './broadcaster'

const setupBroadcaster = () => {

  const vid = document.createElement('video')
  vid.autoplay = true
  vid.setAttribute('muted', true)
  vid.volume = 0
  document.body.appendChild(vid)

  const error = err => {
    console.log(err)
    alert(JSON.stringify(err))
  }

  const ws = new WebSocket(`wss://api.${location.host}/one2many`)
  ws.addEventListener('error', error)

  ws.addEventListener('open', () => {
    const broadcaster = new Broadcaster()
    ws.onmessage = message => {
      const msg = JSON.parse(message.data)
      switch (msg.id) {
        case 'presenterResponse':
          broadcaster.emit('answer', msg.sdpAnswer)
          return
        case 'iceCandidate':
          broadcaster.emit('icecandidate-remote', msg.candidate)
          return
      }
    }
    broadcaster.on('error', error)
    broadcaster.on('stream', stream => vid.srcObject = stream)
    broadcaster.on('offer', offer => {
      ws.send(JSON.stringify({
        id: 'presenter',
        sdpOffer: offer.sdp
      }))
    })
    broadcaster.on('icecandidate', candidate => {
      ws.send(JSON.stringify({
        id: 'onIceCandidate',
        candidate: candidate
      }))
    })
  })
}

export default setupBroadcaster
