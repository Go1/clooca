class commandClass {
    constructor() {
        // コマンドのキャッシュ
        this.command = {};
    }

    // コマンドの取得
    get_command() {
        console.log('command before',this.command);
        console.log('command str before',JSON.stringify(this.command));
        var command = JSON.parse(JSON.stringify(this.command));
        console.log('command after',command);

        // コマンドが取得されたらキャッシュをクリア
        this.command = {};
        return command;
    }

    // コマンドの上書き
    set_command(command) {
        console.log('set command',command);
        this.command = command;
        console.log('set command after',this.command);
    }
}

var commandclass = new commandClass()

module.exports = commandclass;