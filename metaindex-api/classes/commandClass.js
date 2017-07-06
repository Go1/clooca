class commandClass {
    constructor() {
        // コマンドのキャッシュ
        this.command = {};
    }

    // コマンドの取得
    get_command() {
        var command = JSON.parse(JSON.stringify(this.command));

        // コマンドが取得されたらキャッシュをクリア
        this.command = {};
        return command;
    }

    // コマンドの上書き
    set_command(command) {
        this.command = command;
    }
}

var commandclass = new commandClass()

module.exports = commandclass;