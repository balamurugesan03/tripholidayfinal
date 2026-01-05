const mongoose = require('mongoose');

// Day schema for itinerary
const daySchema = new mongoose.Schema({
    day: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    highlights: [{
        type: String
    }]
});

// Itinerary schema
const itinerarySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    subtitle: {
        type: String,
        required: true
    },
    days: [daySchema]
});

// Main Package schema
const packageSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    duration: {
        type: Number,
        required: true,
        min: 1
    },
    durationText: {
        type: String,
        default: function() {
            return `${this.duration} Days / ${this.duration - 1} Nights`;
        }
    },
    type: {
        type: String,
        required: true,
        enum: ['luxury', 'premium', 'budget'],
        lowercase: true
    },
    destination: {
        type: String,
        required: true,
        enum: ['india', 'international', 'pilgrimage'],
        lowercase: true
    },
    travel: {
        type: String,
        required: true,
        enum: ['family', 'couple', 'solo', 'group', 'buddy'],
        lowercase: true
    },
    popular: {
        type: Boolean,
        default: false
    },
    popularBadge: {
        type: String,
        default: 'Most Popular'
    },
    tags: [{
        type: String,
        required: true
    }],
    itinerary: {
        type: itinerarySchema,
        required: true
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries
packageSchema.index({ type: 1, destination: 1, travel: 1 });
packageSchema.index({ popular: -1, price: 1 });
packageSchema.index({ active: 1 });

const Package = mongoose.model('Package', packageSchema);

module.exports = Package;
