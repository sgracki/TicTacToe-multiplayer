var mongoose = require('mongoose');

var GameSchema = new mongoose.Schema({
  token: String,
  ips: [String],
  createdAt: Date
});

module.exports = mongoose.model('Game', GameSchema);
