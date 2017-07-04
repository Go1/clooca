var router = express.Router();

// 選択中のノード名称を返す
router.get( '/', function ( req, res ) {
    var json = JSON.parse(fs.readFileSync(settings.get('selected_indexes_file_path'), 'utf8'));
    res.send(json);
} );

module.exports = router;
