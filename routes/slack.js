var express = require('express');
var models = require('./models/models.js');
var file = require('fs');
var router = express.Router();

/*
 * Test some shit
 */
router.post('/', function(req, res, next) {
    var data = req.body;
    var user = data.team_domain;

    console.log('Request received from ' + user + ': ' + JSON.stringify);

    var auth = JSON.parse(file.readFileSync('./authorization/'+user+'.json'));

    var command = models.slashCommandPayload(data, auth);

    console.log(command);

    if(!command.authorized) {
        res.status(401).json({ claims: [] });
    }
    else {
        res.status(200).json({ claims: auth.claims });
    }
});

/*
 * Grant permissions to new users
 */
router.post('/signup', function(req, res, next) {
    var data = req.body;
    var user = data.team_domain;

    console.log(data);

    console.log('Request received from ' + user);

    var command = models.slashCommandPayload(data, null);

    console.log(command);

    var auth = { 
        token: command.token,
        claims: ['/signup', '/test']
    };

    console.log('Granted auth to ' + auth.token);
    console.log(auth.claims);

    file.writeFileSync('./authorization/'+user+'.json', JSON.stringify(auth));

    res.status(200).json({ success: true });
});

module.exports = router;
