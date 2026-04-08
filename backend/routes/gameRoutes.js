const express = require('express');
const Score = require('../models/Score');
const Player = require('../models/Player');

const router = express.Router();

// 1. Save Game Score API
router.post('/save-score', async (req, res) => {
  try {
    const { guestId, score, coins, distance } = req.body;

    // Basic validation
    if (!guestId || score === undefined || coins === undefined || distance === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Reject unrealistic scores (simplistic anti-cheat)
    if (score > 100000) {
      return res.status(400).json({ error: 'Score is too high, invalid run.' });
    }

    // Ensure player exists in the players collection
    // Using findOneAndUpdate with upsert to avoid duplicate registration errors
    await Player.findOneAndUpdate(
      { guestId },
      { guestId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Save the new score
    const newScore = new Score({
      guestId,
      score,
      coins,
      distance
    });
    await newScore.save();

    // Enforce max 10 scores per user rule (delete oldest ones)
    const userScores = await Score.find({ guestId }).sort({ createdAt: 1 }); // Oldest first
    if (userScores.length > 10) {
      const scoresToDelete = userScores.length - 10;
      const idsToDelete = userScores.slice(0, scoresToDelete).map(s => s._id);
      
      await Score.deleteMany({ _id: { $in: idsToDelete } });
    }

    res.status(201).json({ message: 'Score saved successfully' });
  } catch (error) {
    console.error('Error in /save-score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Get Leaderboard API
router.get('/leaderboard', async (req, res) => {
  try {
    // Return top 10 highest scores sorted by score descending
    // Selecting only required fields + guestId (to identify the player)
    const topScores = await Score.find()
      .sort({ score: -1 })
      .limit(10)
      .select('guestId score coins distance -_id');

    res.status(200).json(topScores);
  } catch (error) {
    console.error('Error in /leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Total Players Count API
router.get('/total-players', async (req, res) => {
  try {
    // Count total documents in players collection (since guestId is unique)
    const count = await Player.countDocuments();
    res.status(200).json({ totalPlayers: count });
  } catch (error) {
    console.error('Error in /total-players:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Player History API
router.get('/player-history/:guestId', async (req, res) => {
  try {
    const { guestId } = req.params;

    // Get the last 10 scores for this player, sorted by newest first
    const history = await Score.find({ guestId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('score coins distance createdAt -_id');

    res.status(200).json(history);
  } catch (error) {
    console.error('Error in /player-history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
