var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next){
	res.send('Hello World from Express Made of AndruFarias');
});

module.exports = router;