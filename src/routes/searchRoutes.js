const express = require('express');
const { search } = require('../controllers/searchController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, search);

module.exports = router;
