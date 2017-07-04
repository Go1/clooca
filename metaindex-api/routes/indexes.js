var router = express.Router();

// ノードの選択
router.post( '/select', function ( req, res ) {
    fs.writeFile(settings.get('selected_indexes_file_path'), JSON.stringify(req.body.selected_indexes));
    res.send([{}]);
} );

// 索引（ノード）リストの更新
router.post( '/', function ( req, res ) {
    if (req.body) {
        clsIndexes.set_indexes(req.body.map(function(itm) {return itm.name}));
    } else {
        clsIndexes.set_indexes([]);
    }
    res.send([{}]);
} );

// 索引（ノード）リストの取得
router.get( '/', function ( req, res ) {
    res.send(clsIndexes.get_indexes());
} );

// 索引（ノード）の追加・変更・削除
router.post( '/edit/:mode', function ( req, res ) {
    clsIndexes.edit_indexes(req.body, req.params.mode);
    res.send([{}]);
} );

// 索引に対して関連付けられたIndexedContainerを取得する
router.get( '/:index_id/indexed_containers', function ( req, res ) {
    res.send(clsIndexes.getICList(req.params.index_id));
} );

// 索引に対してIndexedContainerを関連付ける
router.post( '/:index_id/associate/:indexed_container_id', function ( req, res ) {
    var command = {};

    command.index_id = req.params.index_id;
    command.attribute_name = 'indexedContainers';
    command.indexed_container_id = req.params.indexed_container_id

    clsCmd.set_command(command);

    res.send(
        clsIndexes.associate_index_with_ic(req.params.index_id, req.params.indexed_container_id)
    );
} );

module.exports = router;
