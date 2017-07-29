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
var nodemailer = require('nodemailer');

if (config.language == 'fr') {
  moment.locale('fr');
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

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.gmail.email,
        pass: config.gmail.password
    }
});

Promise.all([p1,p2])
.catch((err) => log('Cannot connect to the api', true))
.then((data) => {
  var hours = data[0];
  var hoursHtml = [];
  var msgHtml = '<h2>Hourly</h2>';
  if (config.language == 'fr') {
    msgHtml = '<h2>Heure par heure</h2>';
  }
  for (var i in hours) {
    if (hours[i].FCTTIME.hour < 6 || hours[i].FCTTIME.hour > 20) continue;
    var date = moment({ years:hours[i].FCTTIME.year, months:hours[i].FCTTIME.mon-1, date:hours[i].FCTTIME.mday, hours:hours[i].FCTTIME.hour, minutes:'0', seconds:'0', milliseconds:'0'});
    var html = `<br><b> ${date.format('LLLL')}</b>:<br><img src="${hours[i].icon_url}" alt="${hours[i].condition}">`;
    if (config.language == 'fr') {
      html += `<br>Risque de précip.: ${hours[i].pop}%`;
      html += `<br>Temperature: ${hours[i].temp.metric}°C`;
      html += `<br>Temperature ressentie: ${hours[i].feelslike.metric}°C`;

      var wdir = hours[i].wdir.dir.replace(/W/ig, 'O');
      html += `<br>Vent: ${wdir} ${hours[i].wspd.metric}km/h`;
      html += `<br>Humidité: ${hours[i].humidity}%`;

      if (hours[i].snow.metric != 0) html += `Neige: ${hours[i].snow.metric}`;
    } else {
      html += `<br>Risk of precipitation: ${hours[i].pop}%`;
      html += `<br>Temperature: ${hours[i].temp.english}°F`;
      html += `<br>Felt temperature: ${hours[i].feelslike.english}°F`;
      html += `<br>Wind: ${hours[i].wdir.dir} ${hours[i].wspd.english}mph`;
      html += `<br>Humidity: ${hours[i].humidity}%`;
      if (hours[i].snow.english != 0) html += `Snow: ${hours[i].snow.english}`;
    }
    msgHtml += html + '<br>';
  }

  if (config.language == 'fr') {
    msgHtml += '<h2>Jours suivant</h2>';
  } else {
    msgHtml += '<h2>Next days</h2>';
  }

  var days = data[1].simpleforecast.forecastday;
  for (var i in days) {
    var date = moment({ years:days[i].date.year, months:days[i].date.month-1, date:days[i].date.day, hours:'7', minutes:'0', seconds:'0', milliseconds:'0'});
    var html = `<br><b> ${date.format('LL')}</b>:<br><img src="${days[i].icon_url}" alt="${days[i].condition}">`;
    if (config.language == 'fr') {
      html += `<br>Risque de précip.: ${days[i].pop}%`;
      html += `<br>Temperature maximale: ${days[i].high.celsius}°C`;
      html += `<br>Temperature minimale: ${days[i].low.celsius}°C`;

      var wdir = days[i].avewind.dir.replace(/W/ig, 'O');
      html += `<br>Vent: ${wdir} ${days[i].avewind.kph}km/h`;
      html += `<br>Humidité: ${days[i].avehumidity}%`;

      if (hours[i].snow.metric != 0) html += `Neige: ${days[i].snow_allday.cm}`;
    } else {
      html += `<br>Risk of precipitation: ${days[i].pop}%`;
      html += `<br>Max temperature: ${days[i].high.fahrenheit}°F`;
      html += `<br>Min temperature: ${days[i].low.fahrenheit}°F`;
      html += `<br>Wind: ${days[i].wdir.dir} ${days[i].avewind.mph}mph`;
      html += `<br>Humidity: ${days[i].avehumidity}%`;
      if (hours[i].snow.english != 0) html += `Snow: ${days[i].snow_allday.in}`;
    }
    msgHtml += html + '<br>';
  }

  var mailOptions = {
    from: `Weather <${config.gmail.email}>`,
    to: config.to_email,
    subject: 'Weather ' + moment().format('LL'),
    html: msgHtml
  };

  if (config.language == 'fr') {
    mailOptions = {
      from: `Météo <${config.gmail.email}>`,
      to: config.to_email,
      subject: 'Météo du ' + moment().format('LL'),
      html: msgHtml
    };
  }

  transporter.sendMail(mailOptions, (error, info) => {
        if (error) return log('There was an error.', true);
        log('Message sent')
    });
});
