import 'webrtc-adapter'
import setupBroadcaster from './lib/setup-broadcaster'
import setupViewer from './lib/setup-viewer'

const broadcasterButton = document.createElement('button')
broadcasterButton.addEventListener('click', setupBroadcaster)
broadcasterButton.textContent = 'Broadcast'

const viewerButton = document.createElement('button')
viewerButton.addEventListener('click', setupViewer)
viewerButton.textContent = 'View'

;[broadcasterButton, viewerButton].forEach(elem => {
  document.body.appendChild(elem)
})
