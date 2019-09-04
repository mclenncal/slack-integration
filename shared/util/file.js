var fs = require('fs');
var log = require('./log.js');

function path(p) {
    var basePath = './';

    if(process.env.OPENSHIFT_DATA_DIR)
        basePath = process.env.OPENSHIFT_DATA_DIR;

    return basePath + p;
}

function exists(file) {
    var fileExists = fs.existsSync(path(file));

    if(fileExists) {
        log.important('File requested and found (file: '+path(file)+').');
    } else {
        log.important('File not found (file: '+path(file)+').');
    }

    return fileExists;
}

function write(file, data) {
    fs.writeFileSync(path(file), data);
}

function read(file) {
    if(!exists(path(file))) {
        return null;
    }

    return fs.readFileSync(path(file));
}

module.exports = {
    read: read,
    exists: exists,
    write: write
}