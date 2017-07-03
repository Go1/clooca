var express = require( 'express' );
var router = express.Router();
var fs = require ( 'fs' );

// ノードの選択
router.post( '/select', function ( req, res ) {
    fs.writeFile('./json/selected_indexes.json', JSON.stringify(req.body.selected_indexes));
    res.send([{}]);
} );

module.exports = router;
