'use strict';

const server = require('./src/server/server.js');
const restPost = require('./src/api/restPost.js');
const restGet = require('./src/api/restGet.js');
const checkDupl = require('./src/api/checkDuplicate.js');
const mysql = require('mysql');
const path = require('path');
var fs = require('fs');

var connection = null;

var serve = new server.Server();
serve.serverInit();

var post = new restPost.Post();
var get = new restGet.Get();

connection = post.connection('empresa');
/* :::::::::::::::::::::::::::¨Peticiones POST ::::::::::::::::::::::::::::::::::::::::::*/

server.app.post('/postDBTablesSync', (req, res) => {

  let data = JSON.parse(JSON.stringify(req.body));
  let database = data[0].bd;
  let arr = [];
  arr.push(data[1]);
  let cd = new checkDupl.CheckDuplicate();
  cd.checkDuplicateToDB(arr, database, res);
});

server.app.post('/postEvaluateAdmin', (req, res) => {
  let data = req.body;
  connection = post.connection(req.body.db);
   connection.connect(function(err){
      if (err) {
        console.log(err);
        res.send('error');
      }else{
        console.log('conected !!');
        let sql = 'INSERT INTO evaluaciones(fecha, tiendas_id_0, usuarios_id_0, evaluacion, tiempo) VALUES(\''+ data.datas[0].fecha +'\', '+ data.datas[0].tiendas_id_0 +', '+data.datas[0].usuarios_id_0+', \''+data.datas[0].evaluacion+'\', \''+data.datas[0].tiempo+'\')';
        console.log(sql);
        let arrSQL = [];
        connection.query(
            sql
            ,
           (error, rows, fields) => {
            if (error) { console.log(error);}
              if (rows.insertId) {
                for (var i = 1; i < data.datas.length; i++) {
                  let arrayP = data.datas[i];
                  let respuestas = arrayP[1].respuestas;
                  let preguntas = arrayP[0].pregunta;
                  console.log(preguntas);
                  let resp = '';

                  for (var f = 0; f < respuestas.length; f ++) {
                    resp += respuestas[f] + ',';
                  }

                  arrSQL.push('INSERT INTO preguntas(preguntas, respuestas, evaluacion) VALUES(\''+ preguntas +'\', \''+ resp.substring(0,resp.length - 1) +'\', '+rows.insertId+')');

                }

                arrSQL.reduce(
                    function (sequence, value) {
                        return sequence.then(function() {
                            return promiseSQL(value);
                        }).then(function(returns) {
                            console.log(returns.response);
                            return Promise.resolve();
                        });
                    },
                    Promise.resolve()
                ).then(function() {
                  console.log('COMPLETED');
                  connection.end();
                  res.send('listo');
                });

              }
        });
      }
   });
});

//promesa que solo espera una consulta SQL y regresa el resultado como json
    function promiseSQL(sqlcadena){
        return new Promise(function (fulfill, reject){
            connection.query(sqlcadena, (err, rows, fields) => {
              fulfill({ response: rows});
            });
        });
    }
/* ::::::::::::::::::::::::::::¨FIN Peticiones POST ::::::::::::::::::::*/

// ::::::::::::::::::::::::: Peticiones GET ::::::::::::::::::::::::::::::::::::::::::
//  /getTableListValues/
server.app.get('/getTableListValues/:database/:table', (req, res) => {
   connection = post.connection(req.params.database);
   connection.connect(function(err){
      if (err) {
        console.log(err);
        res.send('error');
      }else{
        console.log('conected !!');
        get.getTableListValues(req, connection, res);
      }
   });
});

server.app.get('/getValuesTableById/:database/:table/:id', (req, res) => {
   connection = post.connection(req.params.database);
   connection.connect(function(err){
      if (err) {
        console.log(err);
        res.send('error');
      }else{
        console.log('conected !!');
        get.getValuesTableById(req, connection, res);
      }
   });
});

server.app.get('/getValuesQuestionsById/:database/:ideval', (req, res) => {
   connection = post.connection(req.params.database);
   connection.connect(function(err){
      if (err) {
        console.log(err);
        res.send('error');
      }else{
        console.log('conected !!');
        connection.query('SELECT * FROM preguntas WHERE evaluacion = ' + req.params.ideval, (err, rows, fields)=>{
            res.json(JSON.parse(JSON.stringify(rows)));
        });
      }
   });
});

// getDBSync
server.app.get('/getDBTablesSync/:database', (req, res) => {
  connection = post.connection(req.params.database);
  connection.connect(function(err){
    if (err) {
      console.log(err);
      res.send('error');
    }else{
      console.log('conected !!');
      get.getDBTablesSync(req, connection, res);
    }

  });
});

server.app.get('/getDBValuesSync/:database/:user', (req, res) => {
  connection = post.connection(req.params.database);
  connection.connect(function(err){
   if (err) {
      console.log(err);
      res.send('error');
   } else {
      console.log('conected !!');
      get.getDBValuesSync(req, connection, res);
   }
  });
});

server.app.get('/getDashboardsDatas/:db', function (req, res) {
  connection = post.connection(req.params.db);
  connection.connect(function(err){
    if (err)console.log('error');
    connection.query('SELECT COUNT(DISTINCT actividades.usuarios_id_0) as activos FROM actividades WHERE DATE_FORMAT(fecha_i,\'%Y-%m-%d\')=DATE(now());', (err, rows, fields) => {
      let activos = JSON.parse(JSON.stringify(rows[0]));
      let visitas = null;
      connection.query('SELECT COUNT(DISTINCT actividades.id) as visitas FROM actividades where DATE_FORMAT(actividades.fecha_i,\'%Y-%m-%d\')=DATE(now());', (er, r, f) => {
        visitas = JSON.parse(JSON.stringify(r[0]));
        connection.query('SELECT COUNT(DISTINCT actividades.id) as visitas,actividades.id,DATE_FORMAT(fecha_i,\'%Y-%m-%d\') as lafecha,min(fecha_i) dini, max(fecha_f) dfin, TIMEDIFF (max(fecha_f),min(fecha_i)) AS tiempo, usuarios.ruta, usuarios.localidad, usuarios.nombre as promo FROM actividades, usuarios WHERE actividades.usuarios_id_0=usuarios.id AND DATE_FORMAT(fecha_i,\'%Y-%m-%d\')=DATE(now()) GROUP BY actividades.usuarios_id_0;', function(e, dat, fi){
          let jornada =  JSON.parse(JSON.stringify(dat));
          connection.query('SELECT nombre,nip,email,telefono,localidad, foto from usuarios where tiposdeusuarios_id != 2;', (myerr, myrows, myfields) => {
              connection.end();
              let directorio = JSON.parse(JSON.stringify(myrows));
              let configClient = require('./src/util/'+ req.params.db +'.json');
              res.json([activos, visitas, jornada, directorio, configClient]);
          });

        });

      });

    });
  });
});

server.app.get('/getLocationUser/:db/:id', (req, res) => {
  connection = post.connection(req.params.db);
  connection.connect(function(err){
    if (err)console.log('error');
    connection.query('SELECT actividades.id,actividades.fecha_i,DATE_FORMAT(actividades.fecha_i,\'%Y-%m-%d\') AS dia, actividades.fecha_f,actividades.usuarios_id_0, actividades.c_x_i, actividades.c_y_i,actividades.imgF, tiendas.numero,tiendas.tienda,tiendas.id AS gis, cadenas.cadena,tiendas.localizacion, usuarios.nombre, usuarios.app,usuarios.ruta FROM actividades INNER JOIN tiendas ON actividades.tiendas_id_0=tiendas.id INNER JOIN cadenas ON tiendas.cadenas_id=cadenas.id INNER JOIN usuarios ON actividades.usuarios_id_0=usuarios.id WHERE actividades.usuarios_id_0='+ req.params.id +' AND actividades.tiendas_id_0=tiendas.id AND DATE_FORMAT(actividades.fecha_i,\'%Y-%m-%d\')=DATE(now())', (err, rows, fields) => {
       connection.end();
       res.json(JSON.parse(JSON.stringify(rows)));
    });
  });
});

server.app.get('/getUsers/:db/:id', (req, res) => {
  connection = post.connection(req.params.db);
  connection.connect(function(err){
    if (err)console.log('error');
    connection.query('SELECT * FROM usuarios WHERE id= ' + req.params.id, (err, rows, fields) => {
      connection.query('SELECT icono FROM modulos WHERE modulo= \'logo\'' , (e, r, f) => {
        connection.end();
        let response = [];

        let imgJson = JSON.parse(JSON.stringify(r[0]));
        let img = fs.readFileSync(imgJson.icono);

        response.push(JSON.parse(JSON.stringify(rows)));
        response.push(img.toString('base64'));
        res.json(response);
      });
    });
  });
});

server.app.get('/getModulesSicomClent/:client', (req, res) => {
  let configClient = require('./src/util/'+ req.params.client +'.json');
  res.json(configClient);
});

server.app.get('/getDataStudens', (req, res) => {
  connection = post.connection('crunch_expenses');
  connection.query('SELECT * FROM gasto', (err, rows, fields) => {
      connection.end();
      console.log('get gatos');
      if (err) {
        res.json({
            "estado":1,
           "mensaje":"Ha ocurrido un error"
        });
      }else{
        res.json({"estado": 1, "gastos": JSON.parse(JSON.stringify(rows))});
      }

    });
});

server.app.post('/postDataStudens', (req, res) => {
  connection = post.connection('crunch_expenses');
  console.log(JSON.stringify(req.body));
  connection.query('INSERT INTO gasto SET ?',
    {monto : req.body.monto, etiqueta: req.body.etiqueta, descripcion: req.body.descripcion, fecha: req.body.fecha},
     (error, result, fields) => {
      if (error) {
          res.json({"estado": 2, "mensaje": "Creacion fallida"});
      }else{
        console.log(result.insertId);
        res.json({"estado": 1, "mensaje": "Creacion exitosa", "idGasto": result.insertId});
      }
  });
  //res.json({status:200});
});

server.app.get('/getActividades', (req, res) => {
  connection = post.connection('empresa');
  connection.query('SELECT * FROM actividades', (err, rows, fields) => {
      connection.end();
      console.log('get getActividades');
      if (err) {
        connection.end();
        res.json({
            "estado":1,
           "mensaje":"Ha ocurrido un error"
        });
      }else{
        connection.end();
        res.json({"estado": 1, "actividades": JSON.parse(JSON.stringify(rows))});
      }

    });
});

server.app.post('/postActividades', (req, res) => {
  //connection = post.connection('empresa');
  console.log(req.body.fecha_i, req.body.fecha_f, req.body.usuarios_id_0);
  connection.query('CALL insertActivitySICOM(\''
  + req.body.imgF +'\', '
  + req.body.c_x_i +', '
  + req.body.c_y_i +'\', '
  + req.body.fecha_i +'\', '
  + req.body.usuarios_id_0 +', '
  + req.body.tiendas_id_0 +')',
     (error, result, fields) => {
      if (error) {
          console.log(error);
          //connection.end();
          res.json({"estado": 2, "mensaje": "Creacion fallida"});
      }else{
        console.log(result.insertId);
        //connection.end();
        res.json({"estado": 1, "mensaje": "Creacion exitosa", "id": result.insertId});
      }
  });
  //res.json({status:200});
});


server.app.post('/updateActividades', (req, res) => {
  //connection = post.connection('empresa');
  new Promise((resolve, reject) => {
    let data = {
        imgF : req.body.imgF,
        c_x_i: req.body.c_x_i,
        c_y_i: req.body.c_y_i,
        fecha_i: req.body.fecha_i,
        fecha_f: req.body.fecha_f,
        c_x_f: req.body.c_x_f,
        c_y_f: req.body.c_y_f,
        usuarios_id_0: req.body.usuarios_id_0,
        tiendas_id_0: req.body.tiendas_id_0,
        incidenciaE: req.body.incidenciaE
      };

    connection.query('UPDATE actividades SET ? WHERE fecha_i = ? and usuarios_id_0 = ?',
      [data,req.body.fecha_i,req.body.usuarios_id_0],
       (error, result, fields) => {
        console.log('update actividades '+ req.body.fecha_i, req.body.fecha_f, req.body.usuarios_id_0);
        if (error) {
          reject(error);
        }else{
           return resolve(result);
        }
    });
  }).then((resultUpdate) => {
      connection.query('SELECT id from actividades WHERE fecha_i = ? and fecha_f = ? and usuarios_id_0 = ?',
          [req.body.fecha_i, req.body.fecha_f, req.body.usuarios_id_0],
          (e, r, f) => {
            if(e){
              console.error(e);
              res.json({"estado": 2, "mensaje": "select id remoto fallido"});
            }else{
              console.log('Result query update ',r);
              if (r.length > 0) {
                //connection.end();
                res.json({"estado": 3, "mensaje": "Actualización exitosa", "id": r[0].id});
              }else{
                //connection.end();
                res.json({"estado": 2, "mensaje": "select id remoto fallido"});
              }
            }
      });
  }).catch((err)=>{
    console.error(err);
    res.json({"estado": 2, "mensaje": "Creacion fallida"});
  });
  //res.json({status:200});
});
