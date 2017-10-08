const express = require('express');
const app = express();
var http = require('http').Server(app);
const mongoose = require('mongoose');
var io = require('socket.io')(http);
var path = require('path');

var requestIp = require('request-ip');

var secrets = require('./secrets');
var Game = require('./models/Game');

mongoose.connect(secrets.db);
mongoose.connection.on(`error`, () => {
    console.error(`MongoDB Connection Error. Please make sure that MongoDB is running.`);
});
mongoose.Promise = global.Promise;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

function intBetween(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < 25; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

class Room {

    constructor() {
        this.clientIp = requestIp.getClientIp(req);
    }

    connect = (game) => {
        io.on('connection', (socket) => {
            socket.join(game.token)
        });

        return res.render("index", {
            token: game.token
        });
    }

    create() {
        var game = new Game({
            createdAt: new Date(),
            token: makeid(),
            players: [],
            moves: []
        })

        game.save(
            (err) => {
                if(!err) {
                    io.on('connection', (socket) => {
                        socket.join(game.token)
                    });

                    game.players.push({
                        ip: this.clientIp,
                        symbol: intBetween(0, 1) == 1 ? 'x' : 'o',
                        start: intBetween(0, 1)
                    });
                }
            }
        )
    }
}

app.put('/:token', (req, res) => {
    Game.findOne({token: req.params.token}, (err, game) => {
        if(err || !game) {
            return res.sendStatus(404);
        }

        var move = req.body.move;

        game.moves.push(move);

        game.save(
            (err) => {
                if(!err) {
                    io.to(game.token).emit('player moved:'+move.player);
                    return res.send(game).status(200)
                }
            }
        )
    })
})

app.get('/', (req, res) => {
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

    if(!req.query.o) {
        Room.create(
            (game) => {
                res.redirect(`${fullUrl}?o=${game.token}`);
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
                Room.connect(game);
            } else {
                game.ips.push(clientIp)
            }
            
            game.save(
                (err) => {
                    if(!err) {
                        Room.connect(game);
                    }
                }
            )
        })
    }
})

http.listen(3000, () => {
  console.log('Example app listening on port 3000!')
})