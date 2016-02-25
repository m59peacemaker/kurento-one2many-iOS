var React = require('react');
var {Link} = require('react-router');
var getBroadcasts = require('app/api/get-broadcasts');

module.exports = React.createClass({
  getInitialState: function() {
    return {
      broadcasts: []
    };
  },
  componentWillMount: function() {
    getBroadcasts().then(broadcasts => {
      this.setState({
        broadcasts: broadcasts
      });
    });
  },
  render: function() {
    var state = this.state;
    return (<div>
      <Link to="home">Home</Link>
      <ul>
      {state.broadcasts.map(broadcast => {
        return (
          <li>
            <Link to="broadcast" params={{id: broadcast.id}}>{broadcast.id}</Link>
          </li>
        );
      })}
      </ul>
    </div>)
  }
});
