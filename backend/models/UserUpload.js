const mongoose = require('mongoose');

const userUploadSchema = new mongoose.Schema({
  photo: { type: String, default: '' },
  name: { type: String, default: 'Guest' },
  place: { type: String, default: '' },
  isSubscriber: { type: Boolean, default: false },
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

userUploadSchema.virtual('approved').get(function () {
  return this.status === 'approved';
});

userUploadSchema.set('toJSON', { virtuals: true });
userUploadSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('UserUpload', userUploadSchema);
