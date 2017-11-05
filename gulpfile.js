'use strict';
const ngAnnotate = require('gulp-ng-annotate');
const replace = require('gulp-replace-task');
const args = require('yargs').argv;
const gulp = require('gulp');
const spawn = require('child_process').spawn;
const del = require('del');
const path = require('path');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const minify = require('gulp-minify');
const targetPath = 'public/stApp';

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

gulp.task('build', [ "clean" ], () => {
  const env = args.env || 'production';
  const VQ_API_URL = process.env.VQ_API_URL;

  if (!VQ_API_URL) {
    throw new Error('Provide VQ_API_URL');
  }

  console.log('VQ_API_URL: ' + VQ_API_URL)

  const client = gulp
   .src('src/**/*.js')
    .pipe(replace({
      patterns: [
        {
          match: 'VQ_API_URL',
          replacement: VQ_API_URL
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
