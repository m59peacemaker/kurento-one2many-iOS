var React = require('react');
var Link = require('app/router').Link;

module.exports = React.createClass({
  render: function() {
    return (
      <div>
        <Link sref="home">Home</Link>
        <Link sref="nest-parent.child-1" sparams={{foo: 'abc'}}>Child 1</Link>
        <Link sref="nest-parent.child-2">Child 2</Link>
        <h2>Chilrenz</h2>
        <ui-view></ui-view>
      </div>
    );
  }
});
