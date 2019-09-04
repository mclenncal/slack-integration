function json(json, title) {
    var obj = JSON.stringify(json, null, 4);

    console.log('');
    console.log('['+new Date()+']');
    if(title) console.log('>>>> '+title+' <<<<');
    console.log(obj);
    console.log('');
}

function important(message) {
    console.log('['+new Date()+'] >>>> '+message);
}

module.exports = {
    json: json,
    important: important
}