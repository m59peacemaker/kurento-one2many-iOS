var React = require('react');
var Link = require('app/router').Link;

module.exports = React.createClass({
  render: function() {
    return (
      <div>
        <p>Child 2!</p>
        <ui-view></ui-view>
      </div>
    );
  }
});
