var express = require('express')
var ws = require('ws')
var http = require('http')
var kurento = require('kurento-client')

var app = express()

var candidatesQueue = {}
var presenter = null
var viewers = []

var server = http.createServer(app).listen(8080)

var wss = new ws.Server({
  server : server,
  path : '/one2many'
})

var idCounter = 0
function nextUniqueId() {
  idCounter++
  return idCounter.toString()
}

var kurentoClient = null
function getKurentoClient() {
  if (kurentoClient) {
    return Promise.resolve(kurentoClient)
  }
  return kurento('ws://localhost:8888/kurento').then(function(client) {
    kurentoClient = client
    return client
  })
}

wss.on('connection', function(ws) {
  var sessionId = nextUniqueId()

  ws.on('error', function(error) {
    console.log('Connection ' + sessionId + ' error')
    stop(sessionId)
  })

  ws.on('close', function() {
    console.log('Connection ' + sessionId + ' closed')
    stop(sessionId)
  })

  ws.on('message', function(_message) {
    var message = JSON.parse(_message)
    switch (message.id) {
      case 'presenter':
        startPresenter(sessionId, ws, message.sdpOffer, function(error, sdpAnswer) {
          ws.send(JSON.stringify({
            id : 'presenterResponse',
            response : 'accepted',
            sdpAnswer : sdpAnswer
          }))
        })
        break
      case 'viewer':
        startViewer(sessionId, ws, message.sdpOffer, function(error, sdpAnswer) {
          ws.send(JSON.stringify({
            id : 'viewerResponse',
            response : 'accepted',
            sdpAnswer : sdpAnswer
          }))
        })
        break
      case 'stop':
        stop(sessionId)
        break
      case 'onIceCandidate':
        onIceCandidate(sessionId, message.candidate)
        break
    }
  })
})

function startPresenter(sessionId, ws, sdpOffer, callback) {
  clearCandidatesQueue(sessionId)

  presenter = {
    id : sessionId,
    pipeline : null,
    webRtcEndpoint : null
  }

  getKurentoClient()
  .then(function(kurentoClient) {
    return kurentoClient.create('MediaPipeline')
  })
  .then(function(pipeline) {
    presenter.pipeline = pipeline
    return pipeline.create('WebRtcEndpoint')
  }).then(function(webRtcEndpoint) {
    presenter.webRtcEndpoint = webRtcEndpoint
    if (candidatesQueue[sessionId]) {
      while(candidatesQueue[sessionId].length) {
        var candidate = candidatesQueue[sessionId].shift()
        webRtcEndpoint.addIceCandidate(candidate)
      }
    }
    webRtcEndpoint.on('OnIceCandidate', function(event) {
      var candidate = kurento.register.complexTypes.IceCandidate(event.candidate)
      ws.send(JSON.stringify({
        id : 'iceCandidate',
        candidate : candidate
      }))
    })
    webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer) {
      callback(null, sdpAnswer)
    })
    webRtcEndpoint.gatherCandidates(function(error) {
    })
  })
}

function startViewer(sessionId, ws, sdpOffer, callback) {
  clearCandidatesQueue(sessionId)

  presenter.pipeline.create('WebRtcEndpoint').then(function(webRtcEndpoint) {
    viewers[sessionId] = {
      "webRtcEndpoint": webRtcEndpoint,
      "ws": ws
    }

    if (candidatesQueue[sessionId]) {
      while(candidatesQueue[sessionId].length) {
        var candidate = candidatesQueue[sessionId].shift()
        webRtcEndpoint.addIceCandidate(candidate)
      }
    }

    webRtcEndpoint.on('OnIceCandidate', function(event) {
      var candidate = kurento.register.complexTypes.IceCandidate(event.candidate)
      ws.send(JSON.stringify({
        id: 'iceCandidate',
        candidate: candidate
      }))
    })

    webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer) {
      presenter.webRtcEndpoint.connect(webRtcEndpoint, function(error) {
        callback(null, sdpAnswer)
        webRtcEndpoint.gatherCandidates(function(error) {

        })
      })
    })
  })
}

function clearCandidatesQueue(sessionId) {
  if (candidatesQueue[sessionId]) {
    delete candidatesQueue[sessionId]
  }
}

function stop(sessionId) {
  if (presenter !== null && presenter.id == sessionId) {
    for (var i in viewers) {
      var viewer = viewers[i]
      if (viewer.ws) {
        viewer.ws.send(JSON.stringify({
          id: 'stopCommunication'
        }))
      }
    }
    presenter.pipeline.release()
    presenter = null
    viewers = []
  } else if (viewers[sessionId]) {
    viewers[sessionId].webRtcEndpoint.release()
    delete viewers[sessionId]
  }

  clearCandidatesQueue(sessionId)
}

function onIceCandidate(sessionId, _candidate) {
  var candidate = kurento.register.complexTypes.IceCandidate(_candidate)
  if (presenter && presenter.id === sessionId && presenter.webRtcEndpoint) {
    presenter.webRtcEndpoint.addIceCandidate(candidate)
  }
  else if (viewers[sessionId] && viewers[sessionId].webRtcEndpoint) {
    viewers[sessionId].webRtcEndpoint.addIceCandidate(candidate)
  }
  else {
    if (!candidatesQueue[sessionId]) {
      candidatesQueue[sessionId] = []
    }
    candidatesQueue[sessionId].push(candidate)
  }
}
