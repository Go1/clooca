var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');

//var indexes  = require('./routes/indexes');
//var files  = require('./routes/files');
var selected_indexes  = require('./routes/selected_indexes');
//var indexed_containers  = require('./routes/indexed_containers');
//var assets  = require('./routes/assets');
//var models  = require('./routes/models');
//var command  = require('./routes/command');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

//app.use('/indexes', indexes);
//app.use('/files', files);
app.use('/selected_indexes', selected_indexes);
//app.use('/indexed_containers', indexed_containers);
//app.use('/assets', assets);
//app.use('/models', models);
//app.use('/command', command);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
