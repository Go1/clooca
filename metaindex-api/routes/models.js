var router = express.Router();

router.get( '/', function ( req, res ) {
    res.send(clsModel.get_model());
} );

router.post( '/', function ( req, res ) {
    clsModel.set_model(req.body);
    res.send(req.body);
} );

module.exports = router;
