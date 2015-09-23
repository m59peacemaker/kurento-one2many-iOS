var Promise = require('bluebird');
var mkdirp = Promise.promisify(require('mkdirp'));
var config = require('app/config');

module.exports = function() {
  return mkdirp(config.dirs.broadcasts).then(function() {
    return config.dirs.broadcasts;
  });
};
