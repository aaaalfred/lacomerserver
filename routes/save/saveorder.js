var express = require('express');
var router = express.Router();

const Firebase = require('../firebaseconnect.js');

/* GET home page. */
router.get('/saveorder/:folio/:collect/:addressdeliver', (req, res, next) => {
	
	let admin = new Firebase.Admin();
	let conn = admin.connect();
	let db = conn.database();

	let order = db.ref("orders").child(req.params.folio);

	order.set({
		status: "solicitado",
		collect: req.params.collect,
		deliver: req.params.addressdeliver
	});
 	res.send('success');
});



module.exports = router;
