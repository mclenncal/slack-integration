//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    file = require('fs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';


function incomingSlackPayload(payload, authorisation) {
  return {
      authorized: authorized(payload, authorisation),
      valid: validate(payload),
      token: payload.token,
      user: payload.user_id,
      text: payload.text,
      id: payload.trigger_id
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

      if(authorization === null)
        return false;
  
      return payload.token === authorization.token
          && authorization.claims.indexOf(payload.command) > -1;
  }
}

function outgoingSlackPayload(id, text, user) {
  return {
      text: text,
      trigger_id: id,
      response_type: "ephemeral",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "@here - <@" + user + "> is requesting a code review: *<"+text+"|confluence link>*"
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
                text: "First Review"
              },
              style: "primary",
              value: "first-approve:"+id
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                emoji: true,
                text: "Second Review"
              },
              style: "primary",
              value: "second-approve:"+id
            }
          ]
        }
      ]
  };

}

app.get('/', function (req, res) {
  res.status(200).json({ success: true });
});

app.post('/slack', function(req, res) {
  var data = req.body;
  var user = data.team_domain;

  console.log('Request received from ' + user + ': ' + JSON.stringify);

  var auth = JSON.parse(file.readFileSync('./authorization/'+user+'.json'));

  var command = incomingSlackPayload(data, auth);

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
app.post('/slack/signup', function(req, res) {
  var data = req.body;

  console.log(data);

  var user = data.team_domain;

  console.log(data);

  console.log('Request received from ' + user);

  var command = incomingSlackPayload(data, null);

  console.log(command);

  var auth = { 
      token: command.token,
      claims: ['/signup', '/test']
  };

  console.log('Granted auth to ' + auth.token);
  console.log(auth.claims);

  file.writeFileSync('./authorization/'+user+'.json', JSON.stringify(auth));

  res.status(200).json(outgoingSlackPayload(command.id, command.text, command.user));
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
