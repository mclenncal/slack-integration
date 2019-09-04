var fs = require('fs');
var log = require('./log.js');

function path(p, override) {
    var basePath = './';

    if(override)
        basePath = override;

    if(process.env.OPENSHIFT_DATA_DIR)
        basePath = process.env.OPENSHIFT_DATA_DIR;

    return basePath + p;
}

function exists(file, basePathOverride) {
    var fileExists = fs.existsSync(path(file, basePathOverride));

    if(fileExists) {
        log.important('File requested and found (file: '+path(file, basePathOverride)+').');
    } else {
        log.important('File not found (file: '+path(file, basePathOverride)+').');
    }

    return fileExists;
}

function write(file, data, basePathOverride) {
    fs.writeFileSync(path(file, basePathOverride), data);
    log.important('Writing file (file: '+path(file, basePathOverride)+').');
}

function read(file, basePathOverride) {
    if(!exists(file, basePathOverride)) {
        return null;
    }

    return fs.readFileSync(path(file, basePathOverride));
}

module.exports = {
    read: read,
    exists: exists,
    write: write
}