var gulp       = require('gulp');
var browserify = require('browserify');
var source     = require('vinyl-source-stream');
var watchify   = require('watchify');
var del        = require('del');
var merge      = require('lodash/object/merge');
var liveServer = require("live-server");

var config = {
  paths: {
    build: './www',
    copy: [
      './src/index.html',
      './src/app.css',
    ]
  }
};

gulp.task('default', ['build-live']);
gulp.task('clean', clean);
gulp.task('build', function() {
  copyToBuild();
  js();
});
gulp.task('build-live', function() {
  devServer();
  copyToBuild();
  js({
    watch: true
  });
});

function clean() {
  del([
    config.paths.build+'/**',
    '!'+config.paths.build
  ]);
}

function devServer() {
  liveServer.start({
      port: 8081,
      host: '0.0.0.0',
      root: config.paths.build,
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
  ;

  function bundle() {
    console.log('Building JS...');
    return bundler.bundle()
      .on('error', function(err) {
        console.log(err.message);
        this.emit('end');
      })
      .pipe(source('index.js'))
      .pipe(gulp.dest(config.paths.build))
      .on('end', function() { 
        console.log('JS complete.'); 
      })
    ;
  }

  if (opts.watch) {
    bundler = watchify(bundler)
      .transform(require('babelify'))
      .on('update', bundle);
  }

  return bundle();
}

function copyToBuild() {
  return gulp.src(config.paths.copy, {base: './src'}).pipe(gulp.dest(config.paths.build));
}
