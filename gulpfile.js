'use strict';
require('dotenv').config();

const ngAnnotate = require('gulp-ng-annotate');
const replace = require('gulp-replace-task');
const gulp = require('gulp');
const spawn = require('child_process').spawn;
const del = require('del');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const minify = require('gulp-minify');
const runSequence = require('run-sequence');
const targetPath = 'public/stApp';

gulp.task('watch', () => gulp.watch('./src/**/**',  [ 'build' ]));

gulp.task('run', function(cb) {
  if (process.env.ENV.toLowerCase() === 'production') {
        runSequence(
        'clean',
        'build',
        cb
    );
  } else {
        runSequence(
        'clean',
        'build',
        'watch',
        cb
    );
  }
});

gulp.task('clean', () => del([ `${targetPath}/**` ]));

gulp.task('deploy', [ "build" ], () => {
  const eb = spawn('eb', [ 'deploy' ]);

  eb.stdout.on('data', data => {
        console.log(`stdout: ${data}`);
  });

  eb.stderr.on('data', data => {
      console.log(`stderr: ${data}`);
  });

  eb.on('close', code => {
      cb(code !== 0 ? 'error in build' : null);
  });
});

gulp.task('build', () => {
  const client = gulp
   .src('src/**/*.js')
    .pipe(replace({
      patterns: [
        {
          match: 'VQ_API_URL',
          replacement: process.env.API_URL
        }
      ]
    }))
    .pipe(babel({
			presets: ['es2015']
		}))
    .pipe(ngAnnotate())
    .pipe(uglify())
    .pipe(minify())
    .pipe(gulp.dest('public/stApp'));

  const templates = gulp
   .src([ 'src/client/templates/**' ],
     { base: './src/client/templates' })
    .pipe(gulp.dest('public/stApp'));
});
