var express = require('express');
var app = express();
var cors = require('cors');

var CONFIG = require("./app/config.js");
var port = CONFIG.PORT;
 
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressLayouts = require('express-ejs-layouts');
var compression = require('compression');
var minify = require('express-minify');
var http = require("http");
var morgan = require('morgan');

// app.use(morgan('dev'));
// app.use(compression());
// app.use(minify());
app.set('view engine', 'ejs');
app.set('layout', 'layouts/layout');
app.use(expressLayouts);
app.set('json spaces', 4);

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

httpServer.listen(port, serverListener);

function serverListener () {
  var host = httpServer.address().address;
	var port = httpServer.address().port;
	console.log('%s (%s) listening at port %s',CONFIG.APP_NAME,CONFIG.APP_VERSION,port);
}
