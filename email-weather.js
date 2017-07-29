var Wunderground = require('wunderground-api');
var log = require('timed-colored-log');
var isThere = require('is-there');
var path = require('path');
var client = new Wunderground();

if (!isThere(path.resolve(__dirname, './config.json'))) {
  log('You must create config.json file!', true);
  require('touch').sync(path.resolve(__dirname, './config.json'));
  process.exit(1);
}

var config = require('./config');

client.hourly(config, function(err, data) {
  if (err) throw err;
  console.log(data);
});

client.forecast10day(config, function(err, data) {
  if (err) throw err;
  console.log(data);
});
