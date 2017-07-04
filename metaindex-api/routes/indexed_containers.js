var router = express.Router();
var uuid = require( 'node-uuid' );

// IndexedContainerに格納されているモデルのIDを取得する
router.get( '/:id/assets', function ( req, res ) {
    try {
        // ICのリストをJSONファイルから取得
        var ic_list = JSON.parse(fs.readFileSync(settings.get('indexed_containers_file_path'), 'utf8'));
    } catch(e) {
        res.send({
            "error" : {
                "message" : e.message
            }
        });
        return false;
    }

    if (ic_list.hasOwnProperty(req.params.id)) {
        if (ic_list[req.params.id]) {
            res.send(ic_list[req.params.id]);
        } else {
            res.send([]);
        }
    } else {
        res.send([]);
    }
} );

// IndexedContainerの作成
router.post( '/create', function ( req, res ) {
    try {
        // ICのリストをJSONファイルから取得
        var ic_list = JSON.parse(fs.readFileSync(settings.get('indexed_containers_file_path'), 'utf8'));
    } catch (e) {
        res.send({
            "error" : {
                "message" : e.message
            }
        });
        return false;
    }
    // Astahから渡されたモデルのリスト
    var astah_model_id_list = req.body;

    // ICのIDを生成
    var ic_id = uuid.v4();

    // ICに含めるモデルIDのセット
    ic_list[ic_id] = astah_model_id_list;

    // ファイルの保存
    fs.writeFile(settings.get('indexed_containers_file_path'), JSON.stringify(ic_list));

    // 作成したICのIDをAstahへ返す
    res.send(ic_id);
} );

module.exports = router;
