const express = require('express');
const router = express.Router();
const { protectUser } = require('../middleware/auth');
const User = require('../models/User');
const Package = require('../models/Package');

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protectUser, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                favorites: user.favorites,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protectUser, async (req, res) => {
    try {
        const { name, phone, address } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update allowed fields only
        if (name) user.name = name.trim();
        if (phone !== undefined) user.phone = phone.trim();
        if (address) user.address = address;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
});

// @route   PUT /api/user/profile/password
// @desc    Change user password
// @access  Private
router.put('/profile/password', protectUser, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current password and new password'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: error.message
        });
    }
});

// @route   POST /api/user/favorites/:packageId
// @desc    Add package to favorites
// @access  Private
router.post('/favorites/:packageId', protectUser, async (req, res) => {
    try {
        const { packageId } = req.params;

        // Check if package exists and is active
        const package = await Package.findOne({ id: packageId, active: true });
        if (!package) {
            return res.status(404).json({
                success: false,
                message: 'Package not found or is inactive'
            });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if already in favorites
        if (user.favorites.includes(packageId)) {
            return res.status(400).json({
                success: false,
                message: 'Package is already in favorites'
            });
        }

        // Check max favorites limit
        if (user.favorites.length >= 50) {
            return res.status(400).json({
                success: false,
                message: 'You have reached the maximum number of favorites (50)'
            });
        }

        // Add to favorites
        user.favorites.push(packageId);
        await user.save();

        res.json({
            success: true,
            message: 'Package added to favorites',
            favorites: user.favorites
        });
    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding to favorites',
            error: error.message
        });
    }
});

// @route   DELETE /api/user/favorites/:packageId
// @desc    Remove package from favorites
// @access  Private
router.delete('/favorites/:packageId', protectUser, async (req, res) => {
    try {
        const { packageId } = req.params;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Remove from favorites
        user.favorites = user.favorites.filter(id => id !== packageId);
        await user.save();

        res.json({
            success: true,
            message: 'Package removed from favorites',
            favorites: user.favorites
        });
    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing from favorites',
            error: error.message
        });
    }
});

// @route   GET /api/user/favorites
// @desc    Get all favorite packages with full details
// @access  Private
router.get('/favorites', protectUser, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get full package details for all favorites
        const packages = await Package.find({
            id: { $in: user.favorites },
            active: true
        });

        res.json({
            success: true,
            count: packages.length,
            packages: packages
        });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching favorites',
            error: error.message
        });
    }
});

module.exports = router;
