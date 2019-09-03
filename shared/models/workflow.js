var file = require('fs');

function retrieve(id) {
    var path = './workflows/'+id+'.json';

    if(!file.existsSync(path)) {
        return null;
    }

    var workflow = JSON.parse(file.readFileSync(path));

    return workflow;
}

function save(id, payload) {
    var path = './workflows/'+id+'.json';

    file.writeFileSync(path, JSON.stringify(payload));
}

module.exports = {
    retrieve: retrieve,
    save: save
}