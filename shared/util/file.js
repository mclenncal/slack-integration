var fs = require('fs');

function path(p) {
    var basePath = './';

    if(process.env.OPENSHIFT_DATA_DIR)
        basePath = process.env.OPENSHIFT_DATA_DIR;

    return basePath + p;
}

function exists(file) {
    return fs.existsSync(path(file));
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