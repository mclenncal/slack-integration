var express = require('express'),
    app = express.Router(), 
    models = require('../shared/models/slackModels.js'),
    file = require('fs'),
    workflow = require('../shared/models/workflow.js');

/* GET home page. */

app.get('/', function(_, res) {
    res.status(200).json({ reviewBot: 'running|healthy' });
});

app.post('/action', function(req, res) {
    var data = JSON.parse(req.body.payload);
    var user = data.user.id;

    console.log('POST /action request from '+user+' : '+JSON.stringify(data));
  
    var auth = JSON.parse(file.readFileSync('./authorization/'+user+'.json'));
  
    var command = models.incomingSlackPayload(data, auth);
    
    if(!command.authorized) {
        res.status(401).json({ claims: [] });
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
        res.status(200).json(models.outgoingSlackPayload(command.id, 'This release already has enough code reviewers.', [], '<https://api.slack.com/docs/triggers|'+command.id+'>'));
        return;
    }

    if(wflow == null) {
        pload.step = step;
        pload.reviewer = reviewer;

        workflow.save(command.id, pload);
        res.status(200).json(models.outgoingSlackPayload(command.id, '<@"' + user + '"> has agreed to code review.', [], '<https://api.slack.com/docs/triggers|'+command.id+'>'));
    } else {
        wflow.step = step;
        wflow.step = reviewer;

        workflow.save(command.id, wflow);
        res.status(200).json(models.outgoingSlackPayload(command.id, '<@"' + user + '"> has agreed to code review.', [], '<https://api.slack.com/docs/triggers|'+command.id+'>'));
    }
})

app.post('/', function(req, res) {
    var data = req.body;
    var user = data.team_domain;
  
    var auth = JSON.parse(file.readFileSync('./authorization/'+user+'.json'));
  
    var command = models.incomingSlackPayload(data, auth);
  
    if(!command.authorized) {
        res.status(401).json({ claims: [] });
    }
    else {
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
            elements: [
                {
                type: "button",
                text: {
                    type: "plain_text",
                    emoji: true,
                    text: "Code Review"
                },
                style: "primary",
                value: "code-review"
                }
            ]
            }
        ], [], '<https://api.slack.com/docs/triggers|'+command.id+'>')); 
    }
});
  
/*
* Grant permissions to new users
*/
app.post('/authorize', function(req, res) {
    var data = req.body;
    var user = data.team_domain;

    var command = models.incomingSlackPayload(data, null);

    console.log(command);

    var auth = { 
        token: command.token,
        claims: ['/authorize', '/cr', '/review']
    };

    file.writeFileSync('./authorization/'+user+'.json', JSON.stringify(auth));

    res.status(200).json(models.outgoingSlackPayload(command.id, 'authorized', [], '<https://api.slack.com/docs/triggers|'+command.id+'>'));
});

module.exports = app;
