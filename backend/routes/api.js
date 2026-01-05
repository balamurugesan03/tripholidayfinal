const express = require('express');
const router = express.Router();
const Package = require('../models/Package');

// @route   GET /api/packages
// @desc    Get all active packages
// @access  Public
router.get('/packages', async (req, res) => {
    try {
        const packages = await Package.find({ active: true })
            .select('-__v -createdAt -updatedAt')
            .sort({ popular: -1, price: 1 });

        // Transform data to match frontend format
        const packagesData = packages.map(pkg => ({
            id: pkg.id,
            title: pkg.title,
            description: pkg.description,
            image: pkg.image,
            price: pkg.price,
            duration: pkg.duration,
            durationText: pkg.durationText,
            type: pkg.type,
            destination: pkg.destination,
            travel: pkg.travel,
            popular: pkg.popular,
            popularBadge: pkg.popularBadge,
            tags: pkg.tags
        }));

        // Transform itineraries
        const itineraries = {};
        packages.forEach(pkg => {
            if (pkg.itinerary) {
                itineraries[pkg.id] = {
                    title: pkg.itinerary.title,
                    subtitle: pkg.itinerary.subtitle,
                    days: pkg.itinerary.days
                };
            }
        });

        res.json({
            success: true,
            count: packages.length,
            packages: packagesData,
            itineraries: itineraries
        });
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching packages',
            error: error.message
        });
    }
});

// @route   GET /api/packages/:id
// @desc    Get single package by ID
// @access  Public
router.get('/packages/:id', async (req, res) => {
    try {
        const package = await Package.findOne({
            id: req.params.id,
            active: true
        }).select('-__v -createdAt -updatedAt');

        if (!package) {
            return res.status(404).json({
                success: false,
                message: 'Package not found'
            });
        }

        res.json({
            success: true,
            package: {
                id: package.id,
                title: package.title,
                description: package.description,
                image: package.image,
                price: package.price,
                duration: package.duration,
                durationText: package.durationText,
                type: package.type,
                destination: package.destination,
                travel: package.travel,
                popular: package.popular,
                popularBadge: package.popularBadge,
                tags: package.tags
            },
            itinerary: package.itinerary
        });
    } catch (error) {
        console.error('Error fetching package:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching package',
            error: error.message
        });
    }
});

// @route   GET /api/packages/filter/:type
// @desc    Get packages by type, destination, or travel
// @access  Public
router.get('/packages/filter/:filterType/:value', async (req, res) => {
    try {
        const { filterType, value } = req.params;
        const validFilters = ['type', 'destination', 'travel'];

        if (!validFilters.includes(filterType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid filter type'
            });
        }

        const query = { active: true, [filterType]: value };
        const packages = await Package.find(query)
            .select('-__v -createdAt -updatedAt')
            .sort({ popular: -1, price: 1 });

        res.json({
            success: true,
            count: packages.length,
            packages: packages
        });
    } catch (error) {
        console.error('Error filtering packages:', error);
        res.status(500).json({
            success: false,
            message: 'Error filtering packages',
            error: error.message
        });
    }
});

module.exports = router;
