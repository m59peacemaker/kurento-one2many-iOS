### branch `vanilla-app` has better code

That branch is a work in progress - not setup for iOS yet, but the code is much better and doesn't use kurento's client-side library. I'll keep improving it as I get time.

# Kurento One2Many iOS Demo

Adapted from [Kurento's One2Many Demo](https://github.com/Kurento/kurento-tutorial-node/tree/master/kurento-one2many-call)

Start [Kurento Media Server](https://www.kurento.org/docs/current/installation_guide.html) on port 8888 (default).

Enter ./server and run `npm install` then start the server with `node server`

Open ./www/index.js and set line 1 `var host = ` to the ip/domain where kms and the node server are running.

### Test in browser

Serve ./www/index.html

```sh
cd www
live-server --port=8081
```

Visit localhost:8081 in a browser.

### Test on iOS device

Connect your iOS device to the Apple computer.

```sh
npm install xcode -g (globally or locally)
cordova platform add ios
cordova run ios --device
```

[This is the Dockerfile I use](http://pastebin.com/3ih5cqA2) for Kurento Media Server. I run it with --net=host to make things easier.
