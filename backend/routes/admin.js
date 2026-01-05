const express = require('express');
const router = express.Router();
const Package = require('../models/Package');
const { protect, authorize } = require('../middleware/auth');

// Apply authentication to all admin routes
router.use(protect);

// @route   GET /api/admin/packages
// @desc    Get all packages (including inactive)
// @access  Private
router.get('/packages', async (req, res) => {
    try {
        const packages = await Package.find()
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: packages.length,
            packages: packages
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

// @route   GET /api/admin/packages/:id
// @desc    Get single package
// @access  Private
router.get('/packages/:id', async (req, res) => {
    try {
        const package = await Package.findOne({ id: req.params.id });

        if (!package) {
            return res.status(404).json({
                success: false,
                message: 'Package not found'
            });
        }

        res.json({
            success: true,
            package: package
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

// @route   POST /api/admin/packages
// @desc    Create new package
// @access  Private
router.post('/packages', async (req, res) => {
    try {
        const packageData = req.body;

        // Check if package ID already exists
        const existingPackage = await Package.findOne({ id: packageData.id });
        if (existingPackage) {
            return res.status(400).json({
                success: false,
                message: 'Package with this ID already exists'
            });
        }

        // Create new package
        const newPackage = await Package.create(packageData);

        res.status(201).json({
            success: true,
            message: 'Package created successfully',
            package: newPackage
        });
    } catch (error) {
        console.error('Error creating package:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating package',
            error: error.message
        });
    }
});

// @route   PUT /api/admin/packages/:id
// @desc    Update package
// @access  Private
router.put('/packages/:id', async (req, res) => {
    try {
        const packageData = req.body;

        // Find and update package
        const updatedPackage = await Package.findOneAndUpdate(
            { id: req.params.id },
            packageData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedPackage) {
            return res.status(404).json({
                success: false,
                message: 'Package not found'
            });
        }

        res.json({
            success: true,
            message: 'Package updated successfully',
            package: updatedPackage
        });
    } catch (error) {
        console.error('Error updating package:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating package',
            error: error.message
        });
    }
});

// @route   DELETE /api/admin/packages/:id
// @desc    Delete package
// @access  Private
router.delete('/packages/:id', async (req, res) => {
    try {
        const package = await Package.findOneAndDelete({ id: req.params.id });

        if (!package) {
            return res.status(404).json({
                success: false,
                message: 'Package not found'
            });
        }

        res.json({
            success: true,
            message: 'Package deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting package:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting package',
            error: error.message
        });
    }
});

// @route   PATCH /api/admin/packages/:id/toggle
// @desc    Toggle package active status
// @access  Private
router.patch('/packages/:id/toggle', async (req, res) => {
    try {
        const package = await Package.findOne({ id: req.params.id });

        if (!package) {
            return res.status(404).json({
                success: false,
                message: 'Package not found'
            });
        }

        package.active = !package.active;
        await package.save();

        res.json({
            success: true,
            message: `Package ${package.active ? 'activated' : 'deactivated'} successfully`,
            package: package
        });
    } catch (error) {
        console.error('Error toggling package status:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling package status',
            error: error.message
        });
    }
});

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', async (req, res) => {
    try {
        const totalPackages = await Package.countDocuments();
        const activePackages = await Package.countDocuments({ active: true });
        const inactivePackages = await Package.countDocuments({ active: false });
        const popularPackages = await Package.countDocuments({ popular: true });

        const packagesByType = await Package.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        const packagesByDestination = await Package.aggregate([
            { $group: { _id: '$destination', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            stats: {
                totalPackages,
                activePackages,
                inactivePackages,
                popularPackages,
                packagesByType,
                packagesByDestination
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
});

module.exports = router;
