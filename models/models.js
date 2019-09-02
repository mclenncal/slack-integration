var models = {
    incoming: incomingSlackPayload,
    outgoing: outgoingSlackPayload
};

function incomingSlackPayload(payload, authorisation) {
    return {
        authorized: authorized(payload, authorisation),
        valid: validate(payload),
        token: payload.token
    };

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

module.exports = models;