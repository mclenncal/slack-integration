
var app = require('./server.js'),
    reviewBot = require('./apps/reviewBot.js');

app.use('/reviewbot', reviewBot);

module.exports = app;
