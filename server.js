//  OpenShift sample Node application
var express = require('express'),
    app     = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

var reviewBot = require('./apps/reviewBot.js');

app.get('/', function (req, res) {
  res.status(200).json({ success: true });
});

app.use('/reviewbot', reviewBot);

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
