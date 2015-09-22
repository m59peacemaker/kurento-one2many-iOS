var React = require('react');
var Link = require('app/router').Link;

module.exports = React.createClass({
  render: function() {
    return (
      <div>
        <p>State: {this.props.foo}</p>
        <Link className="stuff" sref="home">Home</Link>
        <Link sref="broadcaster">Broadcaster</Link>
        <Link sref="viewer">Viewer</Link>
        <Link sref="nest-parent">Nest Parent</Link>
      </div>
    );
  }
});
