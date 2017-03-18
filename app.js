var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressHandlebars = require('express-handlebars');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var doctorAuthRouter = require('./routes/doctor-auth');
var doctorApiRouter = require('./routes/doctor-api');

var doctor = require('./bin/models/doctor');

var app = express();
var environment = process.env.NODE_ENV;

//view engine setup
app.engine('handlebars', expressHandlebars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

//passport auth setup
//passport config
passport.use('local', new LocalStrategy( doctor.findByPhone ));
passport.deserializeUser( doctor.findById );
passport.serializeUser(function(doctor,done) {
  done(null,doctor.id);
});


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'client/build')));
app.use(session({
  name : '_healthiswealth_<3',
  secret : 'yolopurpleperceptron#!!',
  resave : true,
  saveUninitialized : true,
  cookie : { maxAge : null },
  secure: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/doctor/api', doctorApiRouter);
app.use('/doctor/auth',doctorAuthRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  if(req.xhr) { //X-Requested-With header set
    res.sendStatus(err.status || 500);
  }
  else{ //render error page
    err.status = err.status ? err.status : 500;
    res.status(err.status);
    res.render('error',{err});
  }
  //development only
  if(environment == 'development'){
    console.log(err);
  }
});

module.exports = app;
