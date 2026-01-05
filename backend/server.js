require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/database');

// Import routes
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const userAuthRoutes = require('./routes/userAuth');
const userProfileRoutes = require('./routes/userProfile');
const bookingsRoutes = require('./routes/bookings');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static files (for admin panel)
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user/auth', userAuthRoutes);
app.use('/api/user', userProfileRoutes);
app.use('/api/bookings', bookingsRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Trip Holiday API Server',
        version: '1.0.0',
        endpoints: {
            packages: '/api/packages',
            admin: '/admin',
            adminAuth: '/api/auth/login',
            userAuth: '/api/user/auth/login',
            userRegister: '/api/user/auth/register',
            docs: '/api/docs'
        }
    });
});

// API Documentation route
app.get('/api/docs', (req, res) => {
    res.json({
        title: 'Trip Holiday API Documentation',
        version: '1.0.0',
        endpoints: [
            {
                method: 'GET',
                path: '/api/packages',
                description: 'Get all active packages',
                auth: false
            },
            {
                method: 'GET',
                path: '/api/packages/:id',
                description: 'Get single package by ID',
                auth: false
            },
            {
                method: 'POST',
                path: '/api/auth/login',
                description: 'Admin login',
                auth: false,
                body: { username: 'string', password: 'string' }
            },
            {
                method: 'GET',
                path: '/api/admin/packages',
                description: 'Get all packages (including inactive)',
                auth: true
            },
            {
                method: 'POST',
                path: '/api/admin/packages',
                description: 'Create new package',
                auth: true
            },
            {
                method: 'PUT',
                path: '/api/admin/packages/:id',
                description: 'Update package',
                auth: true
            },
            {
                method: 'DELETE',
                path: '/api/admin/packages/:id',
                description: 'Delete package',
                auth: true
            },
            {
                method: 'POST',
                path: '/api/user/auth/register',
                description: 'User registration',
                auth: false,
                body: { name: 'string', email: 'string', password: 'string' }
            },
            {
                method: 'POST',
                path: '/api/user/auth/login',
                description: 'User login',
                auth: false,
                body: { email: 'string', password: 'string' }
            },
            {
                method: 'GET',
                path: '/api/user/auth/verify',
                description: 'Verify user token',
                auth: true
            },
            {
                method: 'GET',
                path: '/api/user/profile',
                description: 'Get user profile',
                auth: true
            },
            {
                method: 'PUT',
                path: '/api/user/profile',
                description: 'Update user profile',
                auth: true
            },
            {
                method: 'PUT',
                path: '/api/user/profile/password',
                description: 'Change user password',
                auth: true
            },
            {
                method: 'POST',
                path: '/api/user/favorites/:packageId',
                description: 'Add package to favorites',
                auth: true
            },
            {
                method: 'DELETE',
                path: '/api/user/favorites/:packageId',
                description: 'Remove package from favorites',
                auth: true
            },
            {
                method: 'GET',
                path: '/api/user/favorites',
                description: 'Get all favorite packages',
                auth: true
            }
        ]
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}/api`);
    console.log(`🔐 Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api/docs\n`);
});
