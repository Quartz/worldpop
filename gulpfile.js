// Node modules
var browserify  = require("browserify");
var source      = require("vinyl-source-stream");
var browserSync = require("browser-sync");
var reload      = browserSync.reload;
var nib         = require("nib");
var del         = require("del");

// Gulp-related
var gulp        = require("gulp");
var changed     = require("gulp-changed");
var jade        = require("gulp-jade");
var preprocess  = require("gulp-preprocess");
var shell       = require("gulp-shell");
var stylus      = require("gulp-stylus");

//local content
var fs = require("fs");
var archieml = require("archieml");
var request = require('request');
var http = require('http');

var gdoc_id = "";
var gdoc_host = "127.0.0.1:6006";
var gdoc_url = "http://"+gdoc_host+"/"+ gdoc_id;
var content = {};

// local modules
var args = require("./gulp/cli").parse();
var config = require("./gulp/config");
var utils  = require("./gulp/utils");
var _year = new Date().getFullYear().toString();

var qzdataPath = process.env.QZDATA_PATH || '/Users/cgroskopf/src/qzdata';
var thingName = 'worldpop';
var thingPath = qzdataPath + '/' + '2016/worldpop';

var isProd = args.build ? true : false;
var env = isProd ? "prod" : "dev";
var preprocessOpts = { context: { GULP_ENV: env } };
var shellCmd = utils.generateShellCmd(args.build, thingPath, thingName);

var tasks = [
  "browserify",
  "get-content",
  "jade",
  "stylus",
  "copy-libs",
  "copy-assets",
  "copy-fonts",
  "copy-data"
];

function readContentFromFile(cb) {
  fs.readFile("content.json",function(err,data){
    if(!err) {
      content = JSON.parse(data);
      cb();
    }
    else {
      console.log("Cannot load content from file");
      cb(err);
    }

  });
}

// Process conditional comments
gulp.task("preprocess", function () {
  return gulp.src(["src/**", "!src/assets{,/**}", "!src/fonts{,/**}","!src/data{,/**}"])
    .pipe(changed(config.dirs.tmp))
    .pipe(preprocess(preprocessOpts))
    .pipe(gulp.dest(config.dirs.tmp));
});

// Grab gdoc if neeed
gulp.task("get-content", function(cb) {
  if(gdoc_id !== "") {
    request.get({
        "url": gdoc_url
      },
      function(error, resp, body) {
        if(!error && resp.statusCode < 400) {
          content = JSON.parse(body);
          fs.writeFileSync("content.json",body,"utf-8");
          cb();
        }
        else {
          // if the server isn't up load from file
          if(resp && resp.statusCode >= 400) {
            console.log(body);
          }

          console.log("Cannot load content from server, loading from file");
          readContentFromFile(cb);
        }

    });
  }
  else {
    console.log("No google doc specified, loading from file");
    readContentFromFile(cb);
  }

});

// Jade and Stylus for html, css
gulp.task("jade", ["preprocess","get-content"], function () {
  return gulp.src(config.paths.tmp.jade + "/index.jade")
    .pipe(jade({ pretty: true, locals: content }))
    .pipe(gulp.dest(config.dirs.build))
    .pipe(reload({ stream: true }));
});

gulp.task("stylus", ["preprocess"], function () {
  return gulp.src(config.paths.tmp.styl + "/main.styl")
    .pipe(stylus({
      use: [nib()],
      "include css": true,
      errors: true
    }))
    .pipe(gulp.dest(config.paths.build.css))
    .pipe(reload({ stream: true }));
});

gulp.task("browserify", ["preprocess"], function (done) {
  var bundler = browserify({
    entries: [config.paths.tmp.js + "/main.js"],
    debug: !isProd
  });

  if (isProd && !args["dont-minify"]) {
    bundler.transform({ global: true }, "uglifyify");
  }

  return bundler
    .bundle()
    .on('error', function(err) {
      console.error('ERROR IN JS');
      console.error(err.message);
      done();
    })
    .pipe(source("main.js"))
    .pipe(gulp.dest(config.paths.build.js))
    .pipe(reload({ stream: true }));
});

// Clean temp dir
gulp.task("clean", function () {
  return del([
    config.dirs.tmp + "/**",
    config.dirs.build + "/**"
  ]);
});

// Static copy-overs
gulp.task("copy-libs", function () {
  return gulp.src(config.paths.src.js + "/libs/*")
    .pipe(gulp.dest(config.paths.build.js + "/libs"))
    .pipe(reload({ stream: true }));
});

gulp.task("copy-assets", function () {
  return gulp.src(config.paths.src.assets + "/**")
    .pipe(gulp.dest(config.paths.build.assets))
    .pipe(reload({ stream: true }));
});

gulp.task("copy-fonts", function () {
  return gulp.src(config.paths.src.fonts + "/**")
    .pipe(gulp.dest(config.paths.build.fonts))
    .pipe(reload({ stream: true }));
});

gulp.task("copy-data", function () {
  return gulp.src(config.paths.src.data + "/**")
    .pipe(gulp.dest(config.paths.build.data))
    .pipe(reload({ stream: true }));
});

gulp.task("browser-sync", ["watch"], function () {
  browserSync({
    server: {
      baseDir: "build"
    },
    open: false
  });
});

// Serve files, watch for changes and update
gulp.task("watch", tasks, function (done) {
  gulp.watch(config.paths.src.js + "/**", ["browserify"]);
  gulp.watch(config.paths.src.styl + "/**", ["stylus"]);
  gulp.watch(config.paths.src.jade + "/**", ["jade"]);
  gulp.watch(config.paths.src.fonts + "/**", ["copy-fonts"]);
  gulp.watch(config.paths.src.data + "/**", ["copy-data"]);
  gulp.watch(config.paths.src.assets + "/**", ["copy-assets"]);
  done();
});

gulp.task('shell', tasks, shell.task(shellCmd));

gulp.task('build', ['shell']);

if (args.build) {
  gulp.task("default", ["clean"], function () {
    gulp.start("build");
  });
} else {
  gulp.task("default", ["clean"], function () {
    gulp.start("browser-sync");
  });
}

