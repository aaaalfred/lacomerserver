var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');


const firebase = require('../firebaseconnect.js');

router.post('/', (req, res, next) => {
	console.log(req.body);
	let admin_fire = new firebase.Admin();
	let conn = admin_fire.connect();
	let db = conn.database();

	let order = db.ref("orders").child("3_222222");

	let date = new Date();

	let hour = date.getHours();

	console.log('hour ', hour, ' time ', date.getMinutes());

	order.set({
		status: "requested",
		collect: req.body.collect,
		deliver: req.body.deliver,
		order: req.body.order,
		collectHourTime: "12:30"
	});
});

module.exports = router;