var React = require('react');
var {Link} = require('react-router');

module.exports = React.createClass({
  render: function() {
    return (<div>
      <Link to="broadcaster">Be a broadcaster.</Link>
      <Link to="broadcasts">Watch broadcasts.</Link>
    </div>)
  }
});
