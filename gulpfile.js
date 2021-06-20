var gulp = require("gulp");
var browserify = require("browserify");
var source = require("vinyl-source-stream");
var tsify = require("tsify");
var sourcemaps = require("gulp-sourcemaps");
var buffer = require("vinyl-buffer");
const { watch, series } = require("gulp");

const eslint = require('gulp-eslint');
const through2 = require('through2').obj;
const fs = require('fs');
const gulpIf = require('gulp-if');
const combine = require('stream-combiner2').obj;
const prettier = require('gulp-prettier');

var paths = {
  pages: ["src/*.html"],
};
gulp.task("copy-html", function () {
  return gulp.src(paths.pages).pipe(gulp.dest("dist"));
});

gulp.task(
  "default",
  gulp.series(gulp.parallel("copy-html"), function () {
    return browserify({
      basedir: ".",
      debug: true,
      entries: ["src/main.ts"],
      cache: {},
      packageCache: {},
    })
      .plugin(tsify)
      .transform("babelify", {
        presets: ["es2015"],
        extensions: [".ts"],
      })
      .bundle()
      .pipe(source("main.js"))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write("./"))
      .pipe(gulp.dest("dist"));
  })
);

gulp.task('watch', function() {
  watch('src/*.*', gulp.series('default'))
});


gulp.task('lint', function() {
  let eslintResults = {};
  let cacheFilePath = process.cwd() + '/tmp/lintCache.json';
  try {
    eslintResults = JSON.parse(fs.readFileSync(cacheFilePath));
  } catch (e) {
  }

  return gulp.src('src/**/*.ts', {read: false})
    .pipe(gulpIf(
      function(file) {
        return eslintResults[file.path] && eslintResults[file.path].mtime == file.stat.mtime.toJSON();
      },
      through2(function(file, enc, callback) {
          file.eslint = eslintResults[file.path].eslint;
          callback(null, file);
      }),
      combine(
        through2(function(file, enc, callback) {
          file.contents = fs.readFileSync(file.path);
          callback(null, file);
        }),
        eslint(),
        through2(function(file, enc, callback) {
          eslintResults[file.path] = {
            eslint: file.eslint,
            mtime: file.stat.mtime
          };
          callback(null, file);
        })
      )
    ))
    .pipe(eslint.format())
    .on('end', function() {
      fs.writeFileSync(cacheFilePath, JSON.stringify((eslintResults)));
    })
});

gulp.task('prettier', function() {
  return gulp.src('src/**/*.*')
  .pipe(prettier({ editorconfig: true }))
  .pipe(gulp.dest('./src'));
})

gulp.task('lint-without-cache', function() {
  return gulp.src('src/**/*.ts')
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failAfterError());
})

gulp.task('format-until-commit', series('prettier','lint-without-cache'));
