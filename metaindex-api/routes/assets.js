var router = express.Router();

// Astahから渡されたモデルIDを含む索引を取得する
router.get( '/:model_id/indexes', function ( req, res ) {
    var indexList = [];

    try {
        var indexedIC_List = [];

        // ICのリストをJSONファイルから取得
        var ic_list = JSON.parse(fs.readFileSync(settings.get('indexed_containers_file_path'), 'utf8'));

        // 指定されたモデルIDを含むICをリストアップ
        Object.keys(ic_list).forEach(function(ic_id) {
            if (this[ic_id].indexOf(req.params.model_id)>=0) {
                indexedIC_List.push(ic_id);
            }
        }, ic_list);

        // ICが関連付けられた索引のリストをJSONファイルから取得
        var associated_index_list = JSON.parse(fs.readFileSync(settings.get('indexes_id_file_path'), 'utf8'));

        // Astahから渡されたモデルIDを含むICが関連付けられた索引をリストアップ
        Object.keys(associated_index_list).forEach(function(index) {
            ic_list = this[index];
            var ic_list_filter = indexedIC_List.filter(function (ic_id) {
                return ic_list.indexOf(ic_id)>=0;
            });

            if (ic_list_filter.length > 0) {
                indexList.push(index);
            }
        }, associated_index_list);
        
    } catch(e) {
        console.log('Assets Get Error',e);
    }

    res.send(indexList);
} );

module.exports = router;
