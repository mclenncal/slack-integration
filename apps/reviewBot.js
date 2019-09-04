var express = require('express'),
    app = express.Router(),
    axios = require('axios'), 
    models = require('../shared/models/slackModels.js'),
    file = require('../shared/util/file.js'),
    workflow = require('../shared/util/workflow.js'),
    log = require('../shared/util/log.js');

/* GET home page. */

app.get('/', function(_, res) {
    res.status(200).json({ reviewBot: 'running|healthy' });
});

function next(payload) {
    var blocks = payload.message.blocks;

    var elements = blocks[1].elements;
    var user = '<@'+payload.user.username+'>';

    var duplicate = false;

    elements.map(function(e) {
        if(e.text === user)
            duplicate = true;
    });

    if(duplicate)
        return;

    if(elements.length < 3) {
        blocks[1].elements.push({
            type: "mrkdwn",
            text: user
        });
    }

    return blocks;
}

app.post('/action', function(req, res) {
    log.json(req.body, 'POST /action');
    var data = JSON.parse(req.body.payload);
    var user = data.user.id;
    var team = data.team.domain;
  
    var auth = JSON.parse(file.read('authorization/'+team+'.json'));
  
    var command = models.incomingSlackPayload(data, auth);

    log.important('request from '+user+' (action: '+command.payload.actions[0].value+', authorized: '+command.authorized+')');
    
    if(!command.authorized) {
        res.status(401).json();
        return;
    }

    var response = command.payload.message;
    response.blocks = next(command.payload);

    axios.post(command.payload.response_url, response);
    log.important('Responding @ '+command.payload.response_url+' (id: '+command.id+', response: '+JSON.stringify(response, null, 4)+')');

    res.status(200);
})

app.post('/', function(req, res) {
    log.json(req.body, 'POST /');
    var data = req.body;
    var user = data.team_domain;
  
    var auth = JSON.parse(file.read('authorization/'+user+'.json'));
  
    var command = models.incomingSlackPayload(data, auth);
  
    if(!command.authorized) {
        res.status(401).json({ claims: [] });
        return;
    }

    log.important('Code review requested by <@'+command.user+'> (id: '+command.id+', username: '+command.user_name+')');

    res.status(200).json(models.outgoingSlackPayload(command.id, ' ', [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "@here - <@" + command.user + "> is requesting a code review: *<"+command.text+"|confluence link>*"
            },
            accessory: {
                type: "button",
                text: {
                    type: "plain_text",
                    emoji: true,
                    text: "Code Review"
                },
                style: "primary",
                value: "code-review"
            }
        },
        {
            type: "context",
            elements: [{
                "type": "mrkdwn",
                "text": "Reviewers: "
            }]
        }
    ]));
});
  
/*
* Grant permissions to new users
*/
app.post('/authorize', function(req, res) {
    log.json(req.body, 'POST /authorize');
    var data = req.body;
    var user = data.team_domain;

    var command = models.incomingSlackPayload(data, null);

    var auth = { 
        token: command.token,
        claims: ['/authorize', '/cr', '/review', 'block_actions']
    };

    file.write('authorization/'+user+'.json', JSON.stringify(auth));

    log.important('Domain authorised (domain: '+user+', user: '+command.payload.user_name+')');

    res.status(200).json(models.outgoingSlackPayload(command.id, 'authorized', [], '<https://api.slack.com/docs/triggers|'+command.id+'>'));
});

module.exports = app;
