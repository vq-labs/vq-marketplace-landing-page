const express = require('express');
const app = express();
const cors = require('cors');

const CONFIG = require("./app/config.js");
const port = CONFIG.PORT;
 
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const compression = require('compression');
const minify = require('express-minify');
const http = require("http");
const morgan = require('morgan');

// app.use(morgan('dev'));
// app.use(compression());
// app.use(minify());
app.set('view engine', 'ejs');
app.set('layout', 'layouts/layout');
app.set('json spaces', 4);

app.use((req, res, next) => {
  if (req.url.substr(-1) === '/' && req.url.length > 1) {
    req.url.slice(0, -1);
  }
    
  next();
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

httpServer.listen(port, serverListener);

function serverListener () {
  var host = httpServer.address().address;
	var port = httpServer.address().port;
	console.log('%s (%s) listening at port %s',CONFIG.APP_NAME,CONFIG.APP_VERSION,port);
}
