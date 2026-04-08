const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  guestId: { 
    type: String, 
    required: true, 
    index: true 
  },
  score: { 
    type: Number, 
    required: true,
    index: -1 // Optimize for descending sort on leaderboard
  },
  coins: { 
    type: Number, 
    required: true 
  },
  distance: { 
    type: Number, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Score', scoreSchema);
