var express = require('express');
var router = express.Router();
const mysql = require('mysql');

router.post('/', (req, res, next) => {

  let bodyjson = JSON.parse(JSON.stringify(req.body));
  let jsonDataResquest= null;

  for(var e in bodyjson){
    jsonDataResquest=JSON.parse(e);
  }
  console.log("PIN:", jsonDataResquest.PIN);

  let connection = mysql.createConnection({
      host : 'localhost',
      user : 'mctree',
      password : 'mctree',
      database : "lacomer",
      port : 3306,
      multipleStatements: true
  });

  connection.connect((err) => {
      if (err)res.json({"msg": "No se puede conectar a la base de datos"});
      connection.query("select * from tiendas where tiendas.id=(select id_tiendas from usuarios where nip = "+jsonDataResquest.PIN+");"
      ,(err, rows, field) => {
        console.log("result:", JSON.parse(JSON.stringify(rows)));
        res.json(JSON.parse(JSON.stringify(rows[0])));
      });
  });
});

module.exports = router;
