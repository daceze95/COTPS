const fs = require('fs');
const readline = require('readline');
const path = require('path');
const { stdout } = require('process');

const createReadLineStream = ({ routine = 'createReadLineStream', filepath }) => {

    const readlineStream = readline.createInterface({
        input: fs.createReadStream(path.resolve(filepath)),
        output: stdout,
        crlfDelay: Infinity
    });
    return readlineStream;
}

const delay = ({ routine = 'delay', ms = DEFAULT_TIMEOUT } = {}) => {
    console.log(`util: ${routine} adding custom delay of ${ms} milliseconds`);
    return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = { createReadLineStream, delay }
