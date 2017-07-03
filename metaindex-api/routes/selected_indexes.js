var express = require( 'express' );
var router = express.Router();
var fs = require ( 'fs' );

router.get( '/', function ( req, res ) {
    var json = JSON.parse(fs.readFileSync('./json/selected_indexes.json', 'utf8'));
    res.send(json);
} );

module.exports = router;
