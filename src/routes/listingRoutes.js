const express = require('express');
const requireAuth = require('../middleware/auth');
const {
  createListing,
  getListings,
  getMyListings,
  getFavorites,
  getListing,
  updateListing,
  deleteListing,
  toggleFavorite,
} = require('../controllers/listingController');

const router = express.Router();

// Public routes
router.get('/', getListings);

// Authenticated routes — MUST come before '/:id'
// because Express matches in order, and '/mine' / '/favorites'
// would otherwise be captured by '/:id' (invalid ObjectId).
router.get('/mine', requireAuth, getMyListings);
router.get('/favorites', requireAuth, getFavorites);
router.post('/', requireAuth, createListing);
router.patch('/:id', requireAuth, updateListing);
router.delete('/:id', requireAuth, deleteListing);
router.post('/:id/favorite', requireAuth, toggleFavorite);

// Single listing by id — placed last so it doesn't shadow the specific routes above
router.get('/:id', getListing);

module.exports = router;