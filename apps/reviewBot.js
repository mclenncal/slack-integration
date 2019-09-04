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

    var action = command.payload.actions[0].value;

    var wflow = workflow.retrieve(command.id);
    var pload = command;

    var step = [ action ];
    var reviewer = [ user ];

    if(wflow !== null) {
        if(wflow.step) {
            step = wflow.step;
            step.push(action);
        }
        if(wflow.reviewer) {
            if(wflow.reviewer.indexOf(user) > -1) {
                res.status(200).json(models.outgoingSlackPayload(command.id, 'You\'ve already agreed to review, but I appreciate the enthusiasm!', [], '<https://api.slack.com/docs/triggers|'+command.id+'>'));
                return;
            }

            reviewer = wflow.reviewer;
            reviewer.push(user);
        }
    }

    if(reviewer.length > 2) {
        res.status(200).json();
        return;
    }

    if(wflow == null) {
        log.important('New workflow created by '+command.payload.user.user_name+' (id: '+command.id+')');
        pload.step = step;
        pload.reviewer = reviewer;

        workflow.save(command.id, pload);
    } else {
        log.important('Workflow updated by '+user+' (id: '+command.id+')');
        wflow.step = step;
        wflow.reviewer = reviewer;

        workflow.save(command.id, wflow);
    }
    var response = models.outgoingSlackPayload(command.id, 'This release already has enough code reviewers.', [], '<https://api.slack.com/docs/triggers|'+command.id+'>');
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

    res.status(200).json(models.outgoingSlackPayload(command.id, command.text, [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "@here - <@" + command.user + "> is requesting a code review: *<"+command.text+"|confluence link>*"
            }
        },
        {
            type: "actions",
            elements: [{
                type: "button",
                text: {
                    type: "plain_text",
                    emoji: true,
                    text: "Code Review"
                },
                style: "primary",
                value: "code-review"
            }
        ]}
    ], [], '<https://api.slack.com/docs/triggers|'+command.id+'>'));
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
