import {EventEmitter} from 'events'
import createOffer from './create-offer'

const Viewer = () => {

  const emitter = new EventEmitter()
  const pc = new RTCPeerConnection()

  const emitError = (type, error) => emitter.emit('error', {type, error})

  pc.addEventListener('icecandidate', event => {
    if (event.candidate) {
      emitter.emit('icecandidate', event.candidate)
    }
  })

  createOffer(pc, {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
  })
  .then(offer => emitter.emit('offer', offer))
  .catch(error => emitError('connection', error))

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
        const stream = pc.getRemoteStreams()[0]
        emitter.emit('stream', stream)
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

export default Viewer
