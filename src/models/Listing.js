const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      maxlength: 3000,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'NGN',
      enum: ['NGN', 'USD', 'EUR', 'GBP'],
    },
    negotiable: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      enum: [
        'electronics',
        'fashion',
        'home',
        'vehicles',
        'property',
        'services',
        'jobs',
        'other',
      ],
      default: 'other',
      index: true,
    },
    condition: {
      type: String,
      enum: ['new', 'used', 'refurbished', 'not_applicable'],
      default: 'used',
    },
    images: {
      type: [String],
      validate: [(arr) => arr.length <= 8, 'Maximum 8 images per listing'],
      default: [],
    },
    location: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'sold', 'archived'],
      default: 'active',
      index: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    favoritedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

// Full-text search across title + description
listingSchema.index({ title: 'text', description: 'text' });

// Common filter combinations
listingSchema.index({ category: 1, status: 1, createdAt: -1 });
listingSchema.index({ seller: 1, status: 1, createdAt: -1 });

// Add toPublicJSON so the controller returns clean data
listingSchema.methods.toPublicJSON = function () {
  const seller = this.seller;
  return {
    id: this._id.toString(),
    title: this.title,
    description: this.description,
    price: this.price,
    currency: this.currency,
    negotiable: this.negotiable,
    category: this.category,
    condition: this.condition,
    images: this.images,
    location: this.location,
    status: this.status,
    viewCount: this.viewCount,
    favoriteCount: this.favoritedBy?.length ?? 0,
    createdAt: this.createdAt,
    author: seller
      ? {
          id: seller._id?.toString() ?? seller.toString(),
          displayName: seller.displayName ?? '',
          username: seller.username ?? '',
          avatarUrl: seller.avatarUrl ?? '',
        }
      : null,
  };
};

module.exports = mongoose.model('Listing', listingSchema);