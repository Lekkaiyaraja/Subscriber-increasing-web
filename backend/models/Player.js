const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  photo: { type: String },
  teamName: { type: String, required: true },
  votes: { type: Number, default: 0 },
});

module.exports = mongoose.model('Player', playerSchema);
