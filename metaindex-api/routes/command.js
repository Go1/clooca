var router = express.Router();

router.get( '/', function ( req, res ) {
    res.send(clsCmd.get_command());
} );

router.post( '/', function ( req, res ) {
    clsCmd.set_command(JSON.parse(req.body));
    res.send(req.body);
} );

module.exports = router;
