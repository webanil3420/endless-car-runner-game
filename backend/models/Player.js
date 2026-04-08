const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  guestId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Player', playerSchema);
