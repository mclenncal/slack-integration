var express = require('express');
var file = require('fs');
var router = express.Router();

function incomingSlackPayload(payload, authorisation) {
    return {
        authorized: authorized(payload, authorisation),
        valid: validate(payload),
        token: payload.token
    }

    function validate(payload) {
        console.log('Validating request: ' + JSON.stringify(payload));
        var token = payload.token;
    
        if(typeof(token) === 'undefined' || token === null)
            return false;
    
        return true;
    }
    
    function authorized(payload, authorization) {
        console.log('Authorizing request: ' + JSON.stringify(payload));
    
        return payload.token === authorization.token
            && authorization.claims.indexOf(payload.command) > -1;
    }
}

function outgoingSlackPayload(response_url) {
    return {
        response_url: response_url
    };

}

/*
 * Test some shit
 */
router.post('/', function(req, res, next) {
    var data = req.body;
    var user = data.team_domain;

    console.log('Request received from ' + user + ': ' + JSON.stringify);

    var auth = JSON.parse(file.readFileSync('./authorization/'+user+'.json'));

    var command = slashCommandPayload(data, auth);

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

    var command = slashCommandPayload(data, null);

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
