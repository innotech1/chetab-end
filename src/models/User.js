const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    displayName: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    // Identifier can be a phone number or an email — either works for login,
    // matching the phone-first signup pattern common in our target markets.
    identifier: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    bio: { type: String, default: '', maxlength: 160 },
    avatarUrl: { type: String, default: '' },
    coverUrl: { type: String, default: '' },
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    displayName: this.displayName,
    username: this.username,
    bio: this.bio,
    avatarUrl: this.avatarUrl,
    coverUrl: this.coverUrl,
    followerCount: this.followerCount,
    followingCount: this.followingCount,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
