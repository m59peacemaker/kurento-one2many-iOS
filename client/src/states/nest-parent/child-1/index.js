var React = require('react');
var Link = require('app/router').Link;

module.exports = React.createClass({
  render: function() {
    return (
      <div>
        <p>Child 1!</p>
        <Link sref="nest-parent.child-1" sparams={{foo: 'abc'}}>ABC</Link>
        <Link sref="nest-parent.child-1" sparams={{foo: 'def'}}>DEF</Link>
        <p>{this.props.state.params.foo}</p>
      </div>
    );
  }
});
