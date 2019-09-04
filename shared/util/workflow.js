var file = require('./file.js');

function retrieve(id) {
    var path = 'workflows/'+id+'.json';

    if(!file.exists(path)) {
        return null;
    }

    var workflow = JSON.parse(file.read(path));

    return workflow;
}

function save(id, payload) {
    var path = 'workflows/'+id+'.json';

    file.write(path, JSON.stringify(payload));
}

module.exports = {
    retrieve: retrieve,
    save: save
}