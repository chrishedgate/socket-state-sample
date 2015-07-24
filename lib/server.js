var express = require('express');
var app = express();
var path = require('path');
var jwt = require('jsonwebtoken');

var jwtSecret = 'something';

app.set('port', process.env.PORT || 5000);
app.set('env', process.env.NODE_ENV || 'development');

app.use(express.static(path.join(path.normalize(__dirname + '/..'), 'public')));

var server = require('http').createServer(app);
var io = require('socket.io')(server);

io.on('connection', function(socket) {

  socket.on('authenticate', function(data) {
    jwt.verify(data.token, jwtSecret, function(err, decoded) {
      if (err) {
        return socket.emit('unauthorized', {error: "invalid_token"});
      };

      socket.profile = decoded;

      var token = jwt.sign(decoded, jwtSecret, { expiresInSeconds: 60 });
      socket.emit('authenticated', {token: token});
    })
  });

  socket.on('ping', function() {
    if (socket.profile) {
      socket.emit('pong');
    }
  });

  socket.on('login', function(data, cb) {
    var profile = {
      username: data.username,
      original_iat: new Date().getTime()
    };
    socket.profile = profile;

    var token = jwt.sign(profile, jwtSecret, { expiresInSeconds: 60 });
    socket.emit('authenticated', {token: token});
  });

  socket.on('disconnect', function () {
  });
});

exports.start = function(done) {
  server.listen(app.get('port'), function(err) {
    console.log(app.get('env') + " is listening on port " + app.get('port'));
    if (typeof done == 'function') {
      done(err);
    }    
  });
};

exports.stop = function() {
  server.close();
};
