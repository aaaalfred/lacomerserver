var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
//var firebaseadmin = require('./routes/firebaseconnect');
var users = require('./routes/users');
var helloworld = require('./routes/testRest');
var saveorder = require('./routes/save/saveorder');
const newOrder = require('./routes/save/neworder');

var distance = require('distance.js');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* Start proyect connected firebase*/
//send message push notification

var admin = require("firebase-admin");
const STATUS_REQUESTED = "REQUESTED";
const STATUS_ENABLED = "ENABLED";
var serviceAccount = require("./public/key/ComercialMX-29e3029f462a.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://comercialmx-5b1c9.firebaseio.com"
});

var db = admin.database();
var ref = db.ref("orders");
var refUsers = db.ref("users");

var FCM = require('fcm-node');
var serverKey = 'AAAALitjCw8:APA91bFRN6-D6xTME9L_MUBdcXOjw4zwV1ygbYZQ3s7-L_fsDo2KrRKYE5aFrzO8rIKCZLhJFCuwXiQkfE3rICMD7n6kLfST9n5B7XyXvUMK4rHdvZhBI7bnM_3LMARIZmfYUX0Y0_C2';
var fcm = new FCM(serverKey);

ref.orderByChild("status").equalTo(STATUS_REQUESTED).on("child_added", (snapshot, prevChildKey) => {
    var order_added = snapshot.val();
    if (order_added && order_added.notified === false){
      ref.child(order_added.order).update({"notified": true});
      console.log('KEY ORDER', order_added.order);

      var sendmessagePromise = (data) => {
        return new Promise((resolve, reject) => {
          //console.log(data.latitude, ' ', data.longitude);
          var start = {
            latitude: data.latitude,
            longitude: data.longitude
          }
          var end = {
            latitude: data.lat_user,
            longitude: data.long_user
          }

          var distance_bettwen = distance.getDistance(start, end);
          console.log(distance_bettwen);
          if (distance_bettwen < 5) {
            var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
              to: data.token,
              notification: {
                  title: 'LaComer ' + data.order,
                  body: 'Nuevo pedido de la comer',
                  icon: './public/images/ic_launcher'
              },

              data: {  //you can send only notification or only data(or include both)
                  latitude: data.latitude,
                  longitude: data.longitude
              }
            };

            fcm.send(message, (err, response) => {
                if (err) {
                  reject("Something has gone wrong!");
                } else {
                    resolve("Successfully sent message ", message);
                }
            });
        };
      });
    }

      refUsers.orderByChild("status").equalTo(STATUS_ENABLED).on("child_added", (snapshotuser) => {
        sendmessagePromise({
          "token": snapshotuser.val().deviceToken,
           "order": order_added.order,
           "latitude": order_added.latitude,
           "longitude": order_added.longitude,
           "lat_user": snapshotuser.val().latitude,
           "long_user": snapshotuser.val().logitude
         }).then((data) => {
          console.log(data);
        });
      });
    }
});
//========================================

//========================================
app.use('/', index);
app.use('/users', users);

//test route helloworld
app.use('/holamundo', helloworld);


/*::::::::::  rest lacomer app  */

app.use('/lacomer', saveorder);

//rest para dar de alta nueva orden
app.use('/lacomer/neworder', newOrder);

/*::::::::::  rest lacomer app  */

// catch 404 and forward to error handler
app.use((req, res, next) => {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
