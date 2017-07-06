class modelClass {
    constructor() {
        // モデルのキャッシュ
        this.model = [];
    }

    // モデルの取得
    get_model() {
        var model = JSON.parse(JSON.stringify(this.model));
        return model;
    }

    // モデルの上書き
    set_model(model) {
        this.model = model;
    }
}

var modelclass = new modelClass()

module.exports = modelclass;