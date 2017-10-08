var mongoose = require('mongoose');

var GameSchema = new mongoose.Schema({
  token: String,
  players: [{
    ip: String,
    symbol: String,
    start: Boolean
  }],
  moves: [],
  finished: {type: Boolean, default: false},

  createdAt: Date
});

module.exports = mongoose.model('Game', GameSchema);
