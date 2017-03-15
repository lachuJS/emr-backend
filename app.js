var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressHandlebars = require('express-handlebars');

var doctor = require('./routes/doctor');

var app = express();

//view engine setup
app.engine('handlebars', expressHandlebars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/doctor', doctor);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  var error = new Object();

  //production
  if(req.app.get('env') === 'production'){
    if(err.status == 404){
      error.status = 404;
      error.message = 'page doesnt exist.'
    }
    else{
      error.status = err.status || 500;
      error.message = 'somethings seems to be broke. try again';
    }
  }
  //development
  else{
    error.status = err.status || 500;
    error.message = err.stack;
  }

  res.status(error.status);
  res.render('error',{ error: error });
});

module.exports = app;
