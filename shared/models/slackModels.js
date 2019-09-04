function incomingSlackPayload(payload, authorisation) {
    return {
        authorized: authorized(payload, authorisation),
        valid: validate(payload),
        token: payload.token,
        user: payload.user_id,
        text: payload.text,
        id: payload.trigger_id,
        payload: payload
    }
  
    function validate(payload) {
        var token = payload.token;
    
        if(typeof(token) === 'undefined' || token === null)
            return false;
    
        return true;
    }
    
    function authorized(payload, authorization) {  
        if(authorization === null)
          return false;
    
        return payload.token === authorization.token
            && authorization.claims.indexOf(payload.command) > -1;
    }
}
  
function outgoingSlackPayload(id, text, blocks) {
    return {
        text: text,
        trigger_id: id,
        response_type: "in_channel",
        blocks: blocks
    };
}

module.exports = {
    outgoingSlackPayload: outgoingSlackPayload,
    incomingSlackPayload: incomingSlackPayload
};