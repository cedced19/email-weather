var log = require('timed-colored-log');
var isThere = require('is-there');
var path = require('path');

if (!isThere(path.resolve(__dirname, './config.json'))) {
  log('You must create config.json file!', true);
  require('touch').sync(path.resolve(__dirname, './config.json'));
  process.exit(1);
}

var Wunderground = require('wunderground-api');
var config = require('./config');
var client = new Wunderground();
var moment = require('moment');

if (config.language == 'fr') {
  moment.locale('fr')
}

var p1 = new Promise((resolve, reject) => {
  client.hourly(config, function(err, data) {
    if (err) return reject();
    resolve(data);
  });
});

var p2 = new Promise((resolve, reject) => {
  client.forecast10day(config, function(err, data) {
    if (err) return reject();
    resolve(data);
  });
});

var msgHtml = '';

Promise.all([p1,p2])
.catch((err) => log('Cannot connect to the api', true))
.then((data) => {
  var hours = data[0];
  var hoursHtml = [];
  if (config.language == 'fr') {
    msgHtml = '<h2>Heure par heure</h2>';
  } else {
    msgHtml = '<h2>Hourly</h2>';
  }
  for (var i in hours) {
    if (hours[i].FCTTIME.hour < 6) continue;
    var date = moment({ years:hours[i].FCTTIME.year, months:hours[i].FCTTIME.month, date:hours[i].FCTTIME.mday, hours:hours[i].FCTTIME.hour, minutes:'0', seconds:'0', milliseconds:'0'});
    var html = `<br><b> ${date.format('LLLL')}<b>:<br><img src="${hours[i].icon_url}" alt="${hours[i].condition}">`;
    if (config.language == 'fr') {
      html += `<br>Humidité: ${hours[i].humidity}%`;
      html += `<br>Temperature: ${hours[i].temp.metric}°C`;
      html += `<br>Temperature ressentie: ${hours[i].feelslike.metric}°C`;
      html += `<br>Risque de précip.: ${hours[i].pop}°C`;

      var wdir = hours[i].wdir.dir.replace(/W/ig, 'O');
      html += `<br>Vent: ${wdir} ${hours[i].wspd.metric}km/h`;

      if (hours[i].snow != 0) html += `Neige: ${hours[i].temp.metric}`;
    } else {
      html += `<br>Humidity: ${hours[i].humidity}%`;
      html += `<br>Temperature: ${hours[i].temp.english}°F`;
      html += `<br>Felt temperature: ${hours[i].feelslike.english}°F`;
      html += `<br>Risk of precipitation: ${hours[i].pop}°C`;
      html += `<br>Wind: ${hours[i].wdir.dir} ${hours[i].wspd.english}mph`;
      if (hours[i].snow != 0) html += `Snow: ${hours[i].temp.english}`;
    }
    msgHtml += html;
  }
});
