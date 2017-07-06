global.express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');

global.fs = require ( 'fs' );
global.settings = require ( './classes/Settings' );
global.clsIndexes = require ( './classes/indexesClass' );
global.clsCmd = require ( './classes/commandClass' );

var indexes  = require('./routes/indexes');
//var files  = require('./routes/files');
var selected_indexes  = require('./routes/selected_indexes');
var indexed_containers  = require('./routes/indexed_containers');
//var assets  = require('./routes/assets');
//var models  = require('./routes/models');
var command  = require('./routes/command');

var api_app = express();

// view engine setup
api_app.set('views', path.join(__dirname, 'views'));
api_app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
api_app.use(logger('dev'));
api_app.use(bodyParser.json());
api_app.use(bodyParser.urlencoded({ extended: false }));
api_app.use(cookieParser());
api_app.use(express.static(path.join(__dirname, 'public')));

// クロスオリジン制約への対応
api_app.use(cors());

api_app.use('/indexes', indexes);
//app.use('/files', files);
api_app.use('/selected_indexes', selected_indexes);
api_app.use('/indexed_containers', indexed_containers);
//app.use('/assets', assets);
//app.use('/models', models);
api_app.use('/command', command);

// catch 404 and forward to error handler
api_app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
api_app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = api_app;
