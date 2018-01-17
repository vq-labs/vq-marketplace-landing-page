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
const appRoot = require('app-root-path').path;
const fs = require('fs');
const targetPath = 'public/stApp';

const generateConfig = () => {
  if (!args.config) {
    console.log("ERROR: Please provide a config file as an argument!")
  }

  if (!args.env) {
    console.log("ERROR: Please provide an environment as an argument!")
  }
  if(!fs.existsSync(path.join(appRoot, args.config))) {
    console.log("Config file was not found at ", path.join(appRoot, args.config));
    return null;
  } else {
   return fs.readFileSync(path.join(appRoot, args.config), "utf8");
  }
}

if (!generateConfig()) {
  return;
}

const config = JSON.parse(generateConfig());

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
  const client = gulp
   .src('src/**/*.js')
    .pipe(replace({
      patterns: [
        {
          match: 'VQ_API_URL',
          replacement: config[args.env.toUpperCase()]["VQ_MARKETPLACE_LANDING_PAGE"]["API_URL"]
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
