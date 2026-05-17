const express = require('express');
const multer = require('multer');
const { uploadImageBuffer } = require('../utils/cloudinaryUpload');
const Team = require('../models/Team');
const Player = require('../models/Player');
const Match = require('../models/Match');
const Score = require('../models/Score');
const UserUpload = require('../models/UserUpload');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    cb(null, true);
  },
});

router.get('/live-data', async (req, res) => {
  const teams = await Team.find();
  const players = await Player.find();
  const match = await Match.findOne().populate('teamA teamB selectedPlayers.player');
  const scores = await Score.find();
  const uploads = await UserUpload.find({ status: 'approved' }).populate('playerId');
  res.json({
    teams,
    players,
    match,
    scores,
    uploads,
    teamAName: match?.teamAName,
    teamBName: match?.teamBName,
  });
});

router.get('/teams', async (req, res) => {
  const teams = await Team.find();
  res.json(teams);
});

router.get('/players', async (req, res) => {
  const players = await Player.find();
  res.json(players);
});

router.get('/match', async (req, res) => {
  const match = await Match.findOne().populate('teamA teamB selectedPlayers.player');
  res.json(match);
});

router.get('/scores', async (req, res) => {
  const scores = await Score.find();
  res.json(scores);
});

router.post('/vote/:playerId', async (req, res) => {
  try {
    const player = await Player.findById(req.params.playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    player.votes += 1;
    await player.save();
    req.app.get('io').emit('voteUpdated', player);
    res.json(player);
  } catch (error) {
    res.status(500).json({ message: 'Vote failed', error: error.message });
  }
});

const createUploadItem = async (req, res) => {
  try {
    const { playerId, name, place, isSubscriber } = req.body;
    let photoPath = '';

    if (req.file && req.file.buffer) {
      const uploadResult = await uploadImageBuffer(req.file.buffer, {
        folder: 'fan-uploads',
        public_id: `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`,
        resource_type: 'image',
      });
      photoPath = uploadResult.secure_url || '';
    }

    const uploadItem = await UserUpload.create({
      photo: photoPath,
      name: name?.trim() || 'Guest',
      place: place?.trim() || '',
      isSubscriber: isSubscriber === true || isSubscriber === 'true',
      playerId,
      status: 'pending',
    });
    req.app.get('io').emit('newUpload', uploadItem);
    res.json(uploadItem);
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

router.post('/upload', upload.single('photo'), createUploadItem);
router.post('/upload-photo', upload.single('photo'), createUploadItem);

router.get('/subscribers/spotlight', async (req, res) => {
  try {
    const spotlightSubscribers = await UserUpload.find({ status: 'approved', isSubscriber: true })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(spotlightSubscribers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load spotlight subscribers', error: error.message });
  }
});

router.post('/vote', async (req, res) => {
  try {
    const { playerId } = req.body;
    if (!playerId) {
      return res.status(400).json({ message: 'playerId is required' });
    }
    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    player.votes += 1;
    await player.save();
    req.app.get('io').emit('voteUpdated', player);
    res.json(player);
  } catch (error) {
    res.status(500).json({ message: 'Vote failed', error: error.message });
  }
});

router.post('/vote/:playerId', async (req, res) => {
  try {
    const player = await Player.findById(req.params.playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    player.votes += 1;
    await player.save();
    req.app.get('io').emit('voteUpdated', player);
    res.json(player);
  } catch (error) {
    res.status(500).json({ message: 'Vote failed', error: error.message });
  }
});

router.post('/score-update', async (req, res) => {
  try {
    const { team, runs = 0, wicket = false } = req.body;
    const score = await Score.findOne({ team });
    if (!score) {
      return res.status(404).json({ message: 'Team not found' });
    }
    if (wicket) {
      if (score.wickets >= 10) {
        return res.status(400).json({ message: 'Wicket limit reached' });
      }
      score.wickets += 1;
    }
    score.runs += Number(runs);
    await score.save();
    req.app.get('io').emit('scoreUpdated', score);
    res.json(score);
  } catch (error) {
    res.status(500).json({ message: 'Score update failed', error: error.message });
  }
});

module.exports = router;
