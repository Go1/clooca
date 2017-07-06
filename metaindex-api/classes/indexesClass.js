var settings = require( __dirname + '/Settings.js' )
var fs = require ( 'fs' );

class indexesClass {
    constructor() {
        // 索引リストのキャッシュ
        this.indexList = [];
    }

    // 索引リストの取得
    get_indexes() {
        return this.indexList;
    }

    // 索引リストの上書き
    set_indexes(indexes) {
        this.indexList = indexes;
    }

    // 索引リストの編集
    edit_indexes(indexes, mode) {
        switch (mode) {
            case 'add':
                this.add_indexes(indexes);
                break;
            case 'remove':
                this.remove_indexes(indexes);
                break;
            case 'change':
                this.change_indexes(indexes);
                break;
        }
    }

    // 索引リストに追加
    add_indexes(indexes) {
        Array.prototype.push.apply(this.indexList, indexes.map(function(itm) {return itm.name}));
    }

    // 索引リストから指定項目を削除
    remove_indexes(indexes) {
        var indexNames = indexes.map(function(itm) {return itm.name});
        this.indexList = this.indexList.filter(function(itm) {
            return indexNames.indexOf(itm) < 0;
        });

        var associated_index_list = JSON.parse(fs.readFileSync(settings.get('indexes_id_file_path'), 'utf8'));
        var deleted_ic_list = [];

        for (var i = 0; i < indexNames.length; i++) {
            if (associated_index_list.hasOwnProperty(indexNames[i])) {
                // 削除される索引に関連付くICのリストを退避しておく
                Array.prototype.push.apply(deleted_ic_list, associated_index_list[indexNames[i]]);
                // 引数で渡されたindexesにICが関連づけられていたら、関連づけを削除
                delete associated_index_list[indexNames[i]];
            }
        }

        // JSONファイルに書き出し
        fs.writeFile(settings.get('indexes_id_file_path'), JSON.stringify(associated_index_list));

        // 索引IDとICの関連付けも削除
        try {
            var indexed_containers = JSON.parse(fs.readFileSync(settings.get('indexed_containers_file_path'), 'utf8'));
            for (i = 0; i < deleted_ic_list.length; i++) {
                if (indexed_containers.hasOwnProperty(deleted_ic_list[i])) {
                    delete indexed_containers[deleted_ic_list[i]];
                }
            }
            fs.writeFile(settings.get('indexed_containers_file_path'), JSON.stringify(indexed_containers));
        } catch (e) {
        }
    }

    // 索引リスト内の項目を変更
    change_indexes(indexes) {
        var prev = indexes.prev[0].name
        var next = indexes.next[0].name
        var idx = this.indexList.indexOf(prev);

        if (idx >= 0) {
            this.indexList[idx] = next;

            var associated_index_list = JSON.parse(fs.readFileSync(settings.get('indexes_id_file_path'), 'utf8'));

            // 削除する索引にICが関連付けられていたら、関連付け用のキー名称も変更
            if (associated_index_list.hasOwnProperty(prev)) {
                var change_obj = associated_index_list[prev].slice();
                associated_index_list[next] = change_obj;
                delete associated_index_list[prev];

                // JSONファイルに書き出し
                fs.writeFile(settings.get('indexes_id_file_path'), JSON.stringify(associated_index_list));
            }
        }
    }

    // 索引に対して関連付けられたIndexedContainerを取得する
    getICList(index_id) {
        // 索引が見つからない場合はエラーとする
        if (this.indexList.indexOf(index_id) < 0) {
            return {
                "error" : {
                "message" : "指定した索引が見つかりませんでした。(索引ID=#{" + index_id + "}"
                }
            }
        }

        var associated_index_list = JSON.parse(fs.readFileSync(settings.get('indexes_id_file_path'), 'utf8'));

        if (associated_index_list.hasOwnProperty(index_id)) {
            return associated_index_list[index_id];
        } else {
            return [];
        }
    }

    // 索引に対してIndexedContainerを関連付け
    associate_index_with_ic(index_id, ic_id) {
        try {
            // ICが関連付けられた索引のリストをJSONファイルから取得
            var associated_index_list = JSON.parse(fs.readFileSync(settings.get('indexes_id_file_path'), 'utf8'));

            // 索引にic_idを関連付ける
            associated_index_list[index_id] = [ic_id];

            // JSONファイルに書き出し
            fs.writeFile(settings.get('indexes_id_file_path'), JSON.stringify(associated_index_list));

            return [{}];

        } catch(e) {
            return {
                "error" : {
                    "message" : e.message
                }
            };
        }
    }
}

var indexesclass = new indexesClass()

module.exports = indexesclass;