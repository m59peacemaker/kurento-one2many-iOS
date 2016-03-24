import {EventEmitter} from 'events'
import createOffer from './create-offer'

function Broadcaster() {

  const emitter = new EventEmitter()
  const pc = new RTCPeerConnection()

  const emitError = (type, error) => emitter.emit('error', {type, error})

  pc.addEventListener('icecandidate', event => {
    if (event.candidate) {
      emitter.emit('icecandidate', event.candidate)
    }
  })

  const setupStream = () => {
    return navigator.mediaDevices.getUserMedia({
      //audio: true,
      video: true
    })
    .then(stream => {
      emitter.emit('stream', stream)
      return stream
    })
    .catch(error => {
      throw {type: 'device', error}
    })
  }

  const setupConnection = stream => {
    return Promise.resolve()
    .then(() => {
      pc.addStream(stream)
      return createOffer(pc)
    })
    .then(offer => {
      emitter.emit('offer', offer)
    })
    .catch(error => {
      throw {type: 'connection', error}
    })
  }

  setupStream()
  .then(setupConnection)
  .catch(error => emitError(error.type, error.error))

  let ready = false
  let queue = []

  function addQueue() {
    queue = queue.filter(candidate => {
      pc.addIceCandidate(new RTCIceCandidate(candidate))
    })
  }

  emitter.on('icecandidate-remote', candidate => {
    queue.push(candidate)
    if (ready) {
      addQueue()
    }
  })
  emitter.once('answer', answer => {
    pc.setRemoteDescription(
      new RTCSessionDescription({
        type: 'answer',
        sdp: answer
      }),
      () => {
        addQueue()
        ready = true
      },
      error => emitError('connection', error)
    )
  })
  emitter.once('close', () => {
    pc.close()
    emitter.removeAllListeners()
  })

  return emitter
}

export default Broadcaster
