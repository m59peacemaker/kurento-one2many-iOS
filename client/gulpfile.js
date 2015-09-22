var gulp       = require('gulp');
var browserify = require('browserify');
var source     = require('vinyl-source-stream');
var watchify   = require('watchify');
var buffer     = require('vinyl-buffer');
var del        = require('del');
var merge      = require('lodash/object/merge');
var liveServer = require("live-server");

var deps = {
  notIos: [
    './vendor/webrtc-adapter/adapter.js'
  ]
};

gulp.task('default', ['build-live']);
gulp.task('clean', clean);
gulp.task('build', function() {
  indexHtml();
  js({
    deps: deps.notIos
  });
});
gulp.task('build-ios', function() {
  indexHtml();
  js();
});
gulp.task('build-live', function() {
  devServer();
  indexHtml();
  js({
    deps: deps.notIos,
    watch: true
  });
});

function clean() {
  del([
    './www/**',
    '!./www'
  ]);
}

function devServer() {
  liveServer.start({
      port: 8081,
      host: '0.0.0.0',
      root: './www',
      open: false,
      file: 'index.html'
  });
}

function js(opts) {
  opts = merge({
    deps: [],
    watch: false
  }, opts);

  var bundler = browserify({
    entries: opts.deps.concat([
      './src/index.js'
    ])
  })
    .transform(require('jadeify'))
    .transform(require('babelify'))
  ;

  function bundle() {
    console.log('Building JS...');
    return bundler.bundle()
      .on('error', function(err) {
        console.log(err.message);
        this.emit('end');
      })
      .pipe(source('index.js'))
      .pipe(gulp.dest('./www'))
      .on('end', function() { 
        console.log('JS complete.'); 
      })
    ;
  }

  if (opts.watch) {
    bundler = watchify(bundler).on('update', bundle);
  }

  return bundle();
}

function indexHtml() {
  return gulp.src('./src/index.html')
    .pipe(gulp.dest('./www'))
  ;
}
