var
  mysql = require('mysql'),
  environments = require('../environments.json');

var env = process.env.NODE_ENV || 'development';

module.exports = mysql.createPool(environments[env]['mysql']);
