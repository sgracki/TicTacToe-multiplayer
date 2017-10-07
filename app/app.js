const express = require('express');
const app = express();
var http = require('http').Server(app);
const mongoose = require('mongoose');
var io = require('socket.io')(http);

var requestIp = require('request-ip');

var secrets = require('./secrets');
var Game = require('./models/Game');

mongoose.connect(secrets.db);
mongoose.connection.on(`error`, () => {
    console.error(`MongoDB Connection Error. Please make sure that MongoDB is running.`);
});
mongoose.Promise = global.Promise;

io.on('connection', (socket) => {
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', (data) => {
        console.log(data);
    });
});

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < 25; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

app.get('/', (req, res) => {
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

    var clientIp = requestIp.getClientIp(req);

    if(!req.query.o) {
        var game = new Game({
            createdAt: new Date(),
            token: makeid(),
            ips: []
        })

        game.save(
            (err) => {
                if(!err) {
                    game.ips.push(clientIp);
                    res.redirect(`${fullUrl}?o=${game.token}`);
                }
            }
        )
    } else {
        Game.findOne({token: req.query.o}, (err, game) => {
            if(!game || err) {
                return res.send("Room not found!").status(404);
            }

            if(game.ips.length >= 2) {
                return res.send("Room is full!").status(200);
            }

            var clientIp = requestIp.getClientIp(req);

            if(game.ips.indexOf(clientIp) > -1) {
                return res.send("Hello world // gamesocket<3").status(200);
            } else {
                game.ips.push(clientIp)
            }
            
            game.save(
                (err) => {
                    if(!err) {
                        return res.send("Hello world // gamesocket<3").status(200);
                    }
                }
            )
        })
    }
})

http.listen(3000, () => {
  console.log('Example app listening on port 3000!')
})