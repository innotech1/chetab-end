const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// POST /api/auth/signup
async function signup(req, res) {
  try {
    const { displayName, username, identifier, password } = req.body;

    if (!displayName || !username || !identifier || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { identifier: identifier.toLowerCase() }],
    });
    if (existing) {
      return res.status(409).json({ message: 'Username or phone/email already in use' });
    }

    const user = await User.create({ displayName, username, identifier, password });
    const token = generateToken(user._id);

    res.status(201).json({ token, user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier and password are required' });
    }

    const user = await User.findOne({ identifier: identifier.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({ token, user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
}

// GET /api/auth/me
async function getMe(req, res) {
  res.json({ user: req.user.toPublicJSON() });
}

module.exports = { signup, login, getMe };
