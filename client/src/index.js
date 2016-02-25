require('webrtc-adapter-test');
require('app/shims');
var io = require('socket.io-client');
var device = require('app/device');

var React  = require('react');
var Router = require('react-router');
var {Route, Redirect, RouteHandler} = Router;

var Foo = React.createClass({
  render: function() {
    return <RouteHandler/>
  }
});

var routes = (
  <Route name="app" path="/" handler={Foo}>
    <Route name="home"        path="/"              handler={require('./views/home')}        />
    <Route name="broadcaster" path="/broadcaster"   handler={require('./views/broadcaster')} />
    <Route name="broadcasts"  path="/broadcasts"    handler={require('./views/broadcasts' )} />
    <Route name="broadcast"   path="/broadcast/:id" handler={require('./views/broadcast')}   />
    <Redirect to="/" />
  </Route>
);

var root = document.createElement('div');
document.body.appendChild(root);

Router.run(routes, function(Handler) {
  React.render(<Handler/>, root);
});

device.ready().then(function() {
  if (device.is('iOS')) {
    //cordova.plugins.iosrtc.debug.enable('iosrtc*');
    cordova.plugins.iosrtc.registerGlobals();
  }
  //stuff();
});

function view() {
  if (pc) { return; }
}

function stop() {
  if (!pc) { return; }
  sendMessage({id: 'stop'});
  dispose();
}

function error(msg) {
  console.log('ERROR!', msg);
  dispose();
}

function dispose() {
  if (pc) {
    pc.close();
    pc = null;
  }
}
