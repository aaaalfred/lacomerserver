var admin = require("firebase-admin");
var serviceAccount = require("../public/key/ComercialMX-29e3029f462a.json");

class Admin {

	connect(){
		admin.initializeApp({
			  credential: admin.credential.cert(serviceAccount),
			  databaseURL: "https://comercialmx-5b1c9.firebaseio.com"
			});

		return admin;
	}
}

module.exports.Admin = Admin;
