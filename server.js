const express = require('express');
const app = express();
const cors = require('cors');
const args = require('yargs').argv;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const compression = require('compression');
const minify = require('express-minify');
const http = require("http");
const morgan = require('morgan');

const generateConfig = () => {
  if (!args.config) {
    console.log("ERROR: Please provide a config file as an argument!")
  }

  if (!args.env) {
    console.log("ERROR: Please provide an environment as an argument!")
  }

  if(!fs.existsSync(__dirname + args.config)) {
    console.log("Config file was not found at ", __dirname + args.config);
    return null;
  } else {
   return fs.readFileSync(__dirname + args.config, "utf8");
  }
}

if (!generateConfig()) {
  return;
}

const config = JSON.parse(generateConfig());

// app.use(morgan('dev'));
// app.use(compression());
// app.use(minify());
app.set('view engine', 'ejs');
app.set('layout', 'layouts/layout');
app.set('json spaces', 4);

app.use((req, res, next) => {
  if (req.url.substr(-1) === '/' && req.url.length > 1) {
    return res.redirect(301, req.url.slice(0, -1));
  }
    
  return next();
});

app.use(expressLayouts);
app.use(require("cors")());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));


app.use("/libs/materialize-css/dist/fonts/", express.static(__dirname + '/node_modules/materialize-css/fonts/'));  
app.use('/libs/', express.static(__dirname + '/node_modules'));
app.use('/', express.static(__dirname + '/public'));


require('./app/routes.js')(app);

var httpServer = http.createServer(app);

httpServer.listen(config[args.env.toUpperCase()]["VQ_MARKETPLACE_LANDING_PAGE"]["PORT"], serverListener);

function serverListener () {
  var host = httpServer.address().address;
	var port = httpServer.address().port;
	console.log('%s (%s) listening at port %s',
    config[args.env.toUpperCase()]["VQ_MARKETPLACE_LANDING_PAGE"]["APP_NAME"],
    config[args.env.toUpperCase()]["VQ_MARKETPLACE_LANDING_PAGE"]["APP_VERSION"],
    config[args.env.toUpperCase()]["VQ_MARKETPLACE_LANDING_PAGE"]["PORT"]);
}
