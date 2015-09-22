var React = require('react');
var Link = require('app/router').Link;

module.exports = React.createClass({
  render: function() {
    return (
      <div>
        <Link sref="home">Home</Link>
        <h1>Viewer</h1>
        <video></video>
      </div>
    );
  }
});
