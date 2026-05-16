const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  team: { type: String, required: true },
  runs: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
});

module.exports = mongoose.model('Score', scoreSchema);
