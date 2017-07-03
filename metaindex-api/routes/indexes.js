var express = require( 'express' );
var router = express.Router();
var fs = require ( 'fs' );

// ノードの選択
router.post( '/select', function ( req, res ) {
    fs.writeFile('./json/selected_indexes.json', JSON.stringify(req.body.selected_indexes));
    res.send([{}]);
} );

// 索引（ノード）リストの更新
router.post( '/', function ( req, res ) {
    if (req.body) {
        this.indexes = req.body.map(function(itm) {return itm.name});
    } else {
        this.indexes = [];
    }
    res.send([{}]);
} );

// 索引（ノード）リストの取得
router.get( '/', function ( req, res ) {
    res.send(this.indexes);
} );

module.exports = router;