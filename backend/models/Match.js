const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  teamA: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  teamB: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  teamAName: { type: String, default: '' },
  teamBName: { type: String, default: '' },
  selectedPlayers: [
    {
      team: { type: String, required: true },
      player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    },
  ],
  matchTheme: {
    background: { type: String, default: '#f5f8ff' },
    teamAColor: { type: String, default: '#0b3d91' },
    teamBColor: { type: String, default: '#e63946' },
  },
  approvedUsers: [
    {
      uploadId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserUpload' },
      displayedAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Match', matchSchema);
