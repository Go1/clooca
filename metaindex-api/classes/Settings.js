var fs = require ( 'fs' );

class Settings {
    constructor() {
//        this.json = JSON.parse(fs.readFileSync(__dirname + '/../json/config.json', 'utf8'));
        this.json = {
                        "indexed_containers_file_path": __dirname + "/../json/indexed-containers.json",
                        "indexes_id_file_path": __dirname + "/../json/indexes-id.json",
                        "selected_indexes_file_path": __dirname + "/../json/selected-indexes.json"
                    };
    }

    get(param) {
        return this.json[param];
    }
}

var settings = new Settings();

module.exports = settings;