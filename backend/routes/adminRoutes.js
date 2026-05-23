const express = require('express');
const multer = require('multer');
const { uploadImageBuffer } = require('../utils/cloudinaryUpload');
const Team = require('../models/Team');
const Player = require('../models/Player');
const Match = require('../models/Match');
const Score = require('../models/Score');
const UserUpload = require('../models/UserUpload');
const Admin = require('../models/Admin');

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

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username, password });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }
    return res.json({ message: 'Authorized', admin: { username: admin.username } });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
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

router.get('/uploads', async (req, res) => {
  const uploads = await UserUpload.find().populate('playerId');
  res.json(uploads);
});

router.get('/subscribers/today', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaySubscribers = await UserUpload.find({
      status: 'approved',
      isSubscriber: true,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .sort({ createdAt: -1 })
      .populate('playerId');

    res.json(todaySubscribers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load today subscribers', error: error.message });
  }
});

router.post('/create-match', async (req, res) => {
  try {
    const { teamAName, teamBName, selectedPlayers } = req.body;
    const trimmedA = teamAName?.trim();
    const trimmedB = teamBName?.trim();
    if (!trimmedA || !trimmedB) {
      return res.status(400).json({ message: 'Both team names are required' });
    }
    if (trimmedA === trimmedB) {
      return res.status(400).json({ message: 'Team A and Team B must be different' });
    }
    await Score.deleteMany({});
    await Score.create([{ team: trimmedA }, { team: trimmedB }]);
    const match = await Match.create({ teamAName: trimmedA, teamBName: trimmedB, selectedPlayers: selectedPlayers || [] });
    const populated = await Match.findById(match._id).populate('teamA teamB selectedPlayers.player');
    req.app.get('io').emit('matchUpdated', populated);
    req.app.get('io').emit('scoresUpdated');
    req.app.get('io').emit('scoreUpdated', {});
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Create match failed', error: error.message });
  }
});

router.post('/upload-player', upload.single('photo'), async (req, res) => {
  try {
    const { name, teamName } = req.body;
    if (!name || !teamName || !req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'Name, team, and photo are required' });
    }

    const uploadResult = await uploadImageBuffer(req.file.buffer, {
      folder: 'player-uploads',
      public_id: `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`,
      resource_type: 'image',
    });

    const player = await Player.create({
      name,
      teamName,
      photo: uploadResult.secure_url || '',
    });
    req.app.get('io').emit('playerCreated', player);
    res.json(player);
  } catch (error) {
    res.status(500).json({ message: 'Player upload failed', error: error.message });
  }
});

router.post('/select-players', async (req, res) => {
  try {
    const { matchId, selectedPlayers } = req.body;
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    if (!Array.isArray(selectedPlayers) || selectedPlayers.length === 0) {
      return res.status(400).json({ message: 'Selected players are required' });
    }
    match.selectedPlayers = selectedPlayers;
    await match.save();
    const populated = await Match.findById(matchId).populate('teamA teamB selectedPlayers.player');
    req.app.get('io').emit('matchUpdated', populated);
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Select players failed', error: error.message });
  }
});

router.post('/update-score', async (req, res) => {
  try {
    const { team, runs = 0, wicket = false } = req.body;
    const trimmedTeam = String(team || '').trim();
    const runsNumber = Number(runs);

    if (!trimmedTeam) {
      return res.status(400).json({ message: 'Team name is required' });
    }
    if (Number.isNaN(runsNumber)) {
      return res.status(400).json({ message: 'Runs must be a valid number' });
    }

    let score = await Score.findOne({ team: trimmedTeam });
    if (!score) {
      score = await Score.findOneAndUpdate(
        { team: trimmedTeam },
        { team: trimmedTeam, runs: 0, wickets: 0 },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        },
      );
    }

    if (!score) {
      return res.status(500).json({ message: 'Unable to create or find score entry' });
    }

    if (wicket) {
      if ((score.wickets || 0) >= 10) {
        return res.status(400).json({ message: 'Wicket limit reached' });
      }
      score.wickets = (score.wickets || 0) + 1;
    }

    score.runs = (score.runs || 0) + runsNumber;
    await score.save();

    req.app.get('io')?.emit('scoreUpdated', score);
    req.app.get('io')?.emit('scoresUpdated');
    const match = await Match.findOne().populate('teamA teamB selectedPlayers.player');
    if (match) {
      req.app.get('io')?.emit('matchUpdated', match);
    }

    res.json(score);
  } catch (error) {
    console.error('Score update error:', error);
    res.status(500).json({ message: 'Score update failed', error: error.message });
  }
});

const approveUpload = async (req, res) => {
  try {
    const status = req.body.status || 'approved';
    const uploadId = req.params.id || req.body.uploadId;
    const upload = await UserUpload.findById(uploadId);
    if (!upload) {
      return res.status(404).json({ message: 'Upload not found' });
    }
    upload.status = status === 'approved' ? 'approved' : 'pending';
    await upload.save();
    const updatedUpload = await UserUpload.findById(upload._id).populate('playerId');

    req.app.get('io').emit('fan-approved', updatedUpload);
    req.app.get('io').emit('uploadApproved', updatedUpload);
    req.app.get('io').emit('featuredFanUpdated', updatedUpload);
    if (updatedUpload.isSubscriber && updatedUpload.status === 'approved') {
      req.app.get('io').emit('spotlightUpdated');
    }

    const match = await Match.findOne();
    if (match && updatedUpload.status === 'approved') {
      const alreadyApproved = match.approvedUsers.some((item) => item.uploadId.toString() === updatedUpload._id.toString());
      if (!alreadyApproved) {
        match.approvedUsers.push({ uploadId: updatedUpload._id });
        await match.save();
      }
    }

    res.json(updatedUpload);
  } catch (error) {
    res.status(500).json({ message: 'Approve upload failed', error: error.message });
  }
};

router.patch('/approve/:id', approveUpload);
router.post('/approve-upload', approveUpload);
router.post('/approve-user', approveUpload);

router.delete('/delete-upload/:id', async (req, res) => {
  try {
    const upload = await UserUpload.findById(req.params.id);
    if (!upload) {
      return res.status(404).json({ message: 'Upload not found' });
    }

    // Old local file references are ignored safely; Cloudinary storage is authoritative.
    const match = await Match.findOne();
    if (match) {
      match.approvedUsers = match.approvedUsers.filter((item) => item.uploadId.toString() !== upload._id.toString());
      await match.save();
    }

    await upload.deleteOne();
    req.app.get('io').emit('uploadDeleted', { id: upload._id.toString() });
    res.json({ message: 'Upload deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Delete upload failed', error: error.message });
  }
});

router.post('/reset-score', async (req, res) => {
  try {
    const { team } = req.body;
    if (!team) {
      return res.status(400).json({ message: 'Team is required to reset score' });
    }
    const score = await Score.findOne({ team });
    if (!score) {
      return res.status(404).json({ message: 'Score entry not found' });
    }
    score.runs = 0;
    score.wickets = 0;
    await score.save();
    req.app.get('io').emit('scoreUpdated', score);
    res.json(score);
  } catch (error) {
    res.status(500).json({ message: 'Reset failed', error: error.message });
  }
});

router.post('/update-theme', async (req, res) => {
  try {
    const { background, teamAColor, teamBColor } = req.body;
    const match = await Match.findOne();
    if (!match) {
      return res.status(404).json({ message: 'No active match' });
    }
    match.matchTheme = { background, teamAColor, teamBColor };
    await match.save();
    const populated = await Match.findById(match._id).populate('teamA teamB selectedPlayers.player');
    req.app.get('io').emit('themeChange', populated);
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Theme update failed', error: error.message });
  }
});

router.post('/update-team-names', async (req, res) => {
  try {
    const { teamAName, teamBName } = req.body;
    const match = await Match.findOne();
    if (!match) {
      return res.status(404).json({ message: 'No active match' });
    }
    const oldTeamAName = match.teamAName;
    const oldTeamBName = match.teamBName;
    match.teamAName = teamAName;
    match.teamBName = teamBName;
    await match.save();

    const teamNamesToUpdate = [];
    if (oldTeamAName && oldTeamAName !== teamAName) {
      teamNamesToUpdate.push({ oldName: oldTeamAName, newName: teamAName });
    }
    if (oldTeamBName && oldTeamBName !== teamBName) {
      teamNamesToUpdate.push({ oldName: oldTeamBName, newName: teamBName });
    }

    for (const { oldName, newName } of teamNamesToUpdate) {
      await Score.findOneAndUpdate(
        { team: oldName },
        { team: newName },
        { new: true },
      );
    }

    const existingScores = await Score.find({ team: { $in: [teamAName, teamBName] } });
    const existingTeams = existingScores.map((item) => item.team);
    const missingTeams = [teamAName, teamBName].filter((teamName) => !existingTeams.includes(teamName));
    if (missingTeams.length > 0) {
      await Score.create(missingTeams.map((teamName) => ({ team: teamName })));
    }

    const populated = await Match.findById(match._id).populate('teamA teamB selectedPlayers.player');
    req.app.get('io').emit('teamNameChange', populated);
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Team name update failed', error: error.message });
  }
});

const fs = require('fs');
const path = require('path');

const BADGES_FILE = path.join(__dirname, '..', 'supporterBadges.json');

const readBadges = () => {
  try {
    if (!fs.existsSync(BADGES_FILE)) return [];
    const raw = fs.readFileSync(BADGES_FILE, 'utf8') || '[]';
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
};

const writeBadges = (arr) => {
  fs.writeFileSync(BADGES_FILE, JSON.stringify(arr || [], null, 2), 'utf8');
};

// List badges
router.get('/badges', (req, res) => {
  try {
    const badges = readBadges();
    res.json(badges);
  } catch (error) {
    res.status(500).json({ message: 'Failed to read badges', error: error.message });
  }
});

// Create a new badge (upload image + groupName)
router.post('/badges', upload.single('badgeImage'), async (req, res) => {
  try {
    const { groupName } = req.body;
    if (!groupName || !groupName.trim()) return res.status(400).json({ message: 'groupName is required' });
    if (!req.file || !req.file.buffer) return res.status(400).json({ message: 'badgeImage is required' });

    const uploadResult = await uploadImageBuffer(req.file.buffer, {
      folder: 'supporter-badges',
      public_id: `${Date.now()}-${groupName.replace(/\s+/g, '_')}`,
      resource_type: 'image',
    });

    const badges = readBadges();
    if (badges.find((b) => b.groupName.toLowerCase() === groupName.trim().toLowerCase())) {
      return res.status(409).json({ message: 'Badge for this group already exists' });
    }

    const newBadge = { groupName: groupName.trim(), badgeImageUrl: uploadResult.secure_url || '' };
    badges.push(newBadge);
    writeBadges(badges);
    req.app.get('io')?.emit('badgesUpdated', badges);
    res.json(newBadge);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create badge', error: error.message });
  }
});

// Edit badge (change name and/or image)
router.patch('/badges/:groupName', upload.single('badgeImage'), async (req, res) => {
  try {
    const { groupName } = req.params;
    const { newGroupName } = req.body;
    const badges = readBadges();
    const index = badges.findIndex((b) => b.groupName.toLowerCase() === String(groupName || '').trim().toLowerCase());
    if (index === -1) return res.status(404).json({ message: 'Badge not found' });

    if (req.file && req.file.buffer) {
      const uploadResult = await uploadImageBuffer(req.file.buffer, {
        folder: 'supporter-badges',
        public_id: `${Date.now()}-${(newGroupName || badges[index].groupName).replace(/\s+/g, '_')}`,
        resource_type: 'image',
      });
      badges[index].badgeImageUrl = uploadResult.secure_url || badges[index].badgeImageUrl;
    }

    if (newGroupName && newGroupName.trim()) {
      badges[index].groupName = newGroupName.trim();
    }

    writeBadges(badges);
    req.app.get('io')?.emit('badgesUpdated', badges);
    res.json(badges[index]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update badge', error: error.message });
  }
});

// Delete badge
router.delete('/badges/:groupName', (req, res) => {
  try {
    const { groupName } = req.params;
    const badges = readBadges();
    const filtered = badges.filter((b) => b.groupName.toLowerCase() !== String(groupName || '').trim().toLowerCase());
    writeBadges(filtered);
    req.app.get('io')?.emit('badgesUpdated', filtered);
    res.json({ message: 'Badge deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete badge', error: error.message });
  }
});

module.exports = router;
