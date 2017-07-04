var fs = require ( 'fs' );

class Settings {
    constructor() {
        this.json = JSON.parse(fs.readFileSync('./json/config.json', 'utf8'));
    }

    get(param) {
        return this.json[param];
    }
}

var settings = new Settings();

module.exports = settings;