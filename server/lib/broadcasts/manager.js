var broadcasts = {
  idle: {},
  live: {}
};

var mgr = {
  getBroadcast: function(id) {
    return broadcasts.idle[id] || broadcasts.live[id];
  },
  addIdle: function(broadcast) {
    broadcasts.idle[broadcast.id] = broadcast;
  },
  addViewer: function(broadcastId, viewer) {
    var broadcast = mgr.getBroadcast(broadcastId);
    if (!broadcast || !broadcast.viewers) { return; }
    broadcast.viewers[viewer.id] = viewer;
  },
  getViewer: function(broadcastId, viewerId) {
    var broadcast = mgr.getBroadcast(broadcastId);
    if (!broadcast || !broadcast.viewers) { return; }
    return broadcast.viewers[viewerId];
  },
  removeViewer: function(broadcastId, viewerId) {
    var broadcast = mgr.getBroadcast(broadcastId);
    if (!broadcast || !broadcast.viewers) { return; }
    delete broadcast.viewers[viewerId];
  },
  getLiveBroadcast: function(broadcastId) {
    return broadcasts.live[broadcastId];
  },
  makeBroadcastLive: function(broadcastId) {
    broadcasts.live[broadcastId] = broadcasts.idle[broadcastId];
    broadcasts.live[broadcastId].viewers = {};
    delete broadcasts.idle[broadcastId];
  },
  removeBroadcast: function(broadcastId) {
    delete broadcasts.idle[broadcastId];
    delete broadcasts.live[broadcastId];
  },
  isLive: function(broadcastId) {
    return !!mgr.getLiveBroadcast(broadcastId);
  }
};

module.exports = mgr;
