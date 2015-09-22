var config = {
  port: 8080,
  dirs: {
    broadcasts: __dirname+'/tmp/broadcasts',
  },
  video: {
    type: {
      record: 'webm',
      playback: 'mp4'
    }
  }
};

module.exports = config;
