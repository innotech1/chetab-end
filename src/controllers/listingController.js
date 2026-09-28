const Listing = require('../models/Listing');
const User = require('../models/User');

const PAGE_SIZE = 20;

// POST /api/listings
async function createListing(req, res) {
  try {
    const {
      title,
      description,
      price,
      currency,
      negotiable,
      category,
      condition,
      images,
      location,
    } = req.body;

    if (!title || !description || price === undefined || price === null) {
      return res.status(400).json({ message: 'Title, description, and price are required' });
    }

    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ message: 'Price must be a non-negative number' });
    }

    const listing = await Listing.create({
      seller: req.user._id,
      title: title.trim(),
      description: description.trim(),
      price,
      currency: currency || 'NGN',
      negotiable: Boolean(negotiable),
      category: category || 'other',
      condition: condition || 'used',
      images: Array.isArray(images) ? images.slice(0, 8) : [],
      location: location ? location.trim() : '',
    });

    await listing.populate('seller', 'displayName username avatarUrl');

    res.status(201).json({ listing: listing.toPublicJSON() });
  } catch (err) {
    console.error('createListing error:', err);
    res.status(500).json({ message: 'Could not create listing', error: err.message });
  }
}

// GET /api/listings?page=1&category=electronics&q=iphone&minPrice=&maxPrice=&location=&sort=newest
async function getListings(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const skip = (page - 1) * PAGE_SIZE;

    const filter = { status: 'active' };

    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }

    if (req.query.location) {
      filter.location = { $regex: req.query.location.trim(), $options: 'i' };
    }

    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }

    if (req.query.q && req.query.q.trim()) {
      filter.$text = { $search: req.query.q.trim() };
    }

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
    };
    const sort = sortMap[req.query.sort] || sortMap.newest;

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(PAGE_SIZE + 1)
        .populate('seller', 'displayName username avatarUrl'),
      Listing.countDocuments(filter),
    ]);

    const hasMore = listings.length > PAGE_SIZE;
    const trimmed = hasMore ? listings.slice(0, PAGE_SIZE) : listings;

    res.json({
      listings: trimmed.map((l) => l.toPublicJSON()),
      page,
      hasMore,
      total,
    });
  } catch (err) {
    console.error('getListings error:', err);
    res.status(500).json({ message: 'Could not load listings', error: err.message });
  }
}

// GET /api/listings/mine?status=active
async function getMyListings(req, res) {
  try {
    const filter = { seller: req.user._id };
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }

    const listings = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .populate('seller', 'displayName username avatarUrl');

    res.json({ listings: listings.map((l) => l.toPublicJSON()) });
  } catch (err) {
    console.error('getMyListings error:', err);
    res.status(500).json({ message: 'Could not load your listings', error: err.message });
  }
}

// GET /api/listings/favorites
async function getFavorites(req, res) {
  try {
    const listings = await Listing.find({
      favoritedBy: req.user._id,
      status: { $ne: 'archived' },
    })
      .sort({ createdAt: -1 })
      .populate('seller', 'displayName username avatarUrl');

    res.json({ listings: listings.map((l) => l.toPublicJSON()) });
  } catch (err) {
    console.error('getFavorites error:', err);
    res.status(500).json({ message: 'Could not load favorites', error: err.message });
  }
}

// GET /api/listings/:id
async function getListing(req, res) {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('seller', 'displayName username avatarUrl');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({ listing: listing.toPublicJSON() });
  } catch (err) {
    console.error('getListing error:', err);
    res.status(500).json({ message: 'Could not load listing', error: err.message });
  }
}

// PATCH /api/listings/:id
async function updateListing(req, res) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own listings' });
    }

    const allowed = [
      'title',
      'description',
      'price',
      'currency',
      'negotiable',
      'category',
      'condition',
      'images',
      'location',
      'status',
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'images' && Array.isArray(req.body.images)) {
          listing.images = req.body.images.slice(0, 8);
        } else {
          listing[key] = req.body[key];
        }
      }
    }

    await listing.save();
    await listing.populate('seller', 'displayName username avatarUrl');

    res.json({ listing: listing.toPublicJSON() });
  } catch (err) {
    console.error('updateListing error:', err);
    res.status(500).json({ message: 'Could not update listing', error: err.message });
  }
}

// DELETE /api/listings/:id
async function deleteListing(req, res) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own listings' });
    }

    await listing.deleteOne();
    res.json({ message: 'Listing deleted' });
  } catch (err) {
    console.error('deleteListing error:', err);
    res.status(500).json({ message: 'Could not delete listing', error: err.message });
  }
}

// POST /api/listings/:id/favorite  (toggle)
async function toggleFavorite(req, res) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const userId = req.user._id;
    const idx = listing.favoritedBy.findIndex((id) => id.toString() === userId.toString());

    if (idx >= 0) {
      listing.favoritedBy.splice(idx, 1);
    } else {
      listing.favoritedBy.push(userId);
    }

    await listing.save();
    res.json({
      favorited: idx < 0,
      favoriteCount: listing.favoritedBy.length,
    });
  } catch (err) {
    console.error('toggleFavorite error:', err);
    res.status(500).json({ message: 'Could not update favorite', error: err.message });
  }
}

module.exports = {
  createListing,
  getListings,
  getMyListings,
  getFavorites,
  getListing,
  updateListing,
  deleteListing,
  toggleFavorite,
};