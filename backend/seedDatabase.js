require('dotenv').config();
const mongoose = require('mongoose');
const Package = require('./models/Package');
const Admin = require('./models/Admin');
const connectDB = require('./config/database');

// Sample packages data (from fallback data)
const packages = [
    {
        id: 'dubai',
        title: 'Dubai Luxury Escape',
        description: 'Experience the luxury of Dubai with 5-star hotels, desert safari, and Burj Khalifa',
        image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop&auto=format',
        price: 150000,
        duration: 7,
        type: 'luxury',
        destination: 'international',
        travel: 'family',
        popular: true,
        popularBadge: 'Most Popular',
        tags: ['Luxury', 'International'],
        itinerary: {
            title: 'Dubai Luxury Escape',
            subtitle: '7 Days / 6 Nights',
            days: [
                {
                    day: 1,
                    title: 'Arrival in Dubai',
                    description: 'Arrive at Dubai International Airport. Meet and greet by our representative. Transfer to your 5-star hotel.',
                    highlights: ['Airport Transfer', 'Hotel Check-in', 'Welcome Drink']
                },
                {
                    day: 2,
                    title: 'Dubai City Tour',
                    description: 'Morning city tour covering Burj Khalifa, Dubai Mall, and Dubai Fountain.',
                    highlights: ['Burj Khalifa', 'Dubai Mall', 'Dubai Museum']
                }
            ]
        }
    },
    {
        id: 'goa',
        title: 'Goa Beach Paradise',
        description: 'Relax on pristine beaches, enjoy water sports, and explore Portuguese heritage',
        image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&h=600&fit=crop&auto=format',
        price: 37000,
        duration: 5,
        type: 'premium',
        destination: 'india',
        travel: 'couple',
        popular: false,
        tags: ['Premium', 'India'],
        itinerary: {
            title: 'Goa Beach Paradise',
            subtitle: '5 Days / 4 Nights',
            days: [
                {
                    day: 1,
                    title: 'Arrival in Goa',
                    description: 'Arrive at Goa International Airport. Transfer to your beach resort.',
                    highlights: ['Airport Transfer', 'Resort Check-in', 'Beach Walk']
                }
            ]
        }
    }
];

// Seed function
const seedDatabase = async () => {
    try {
        // Connect to database
        await connectDB();

        console.log('\n🌱 Starting database seed...\n');

        // Clear existing data
        console.log('🗑️  Clearing existing packages...');
        await Package.deleteMany({});
        console.log('✅ Packages cleared');

        console.log('🗑️  Clearing existing admins...');
        await Admin.deleteMany({});
        console.log('✅ Admins cleared\n');

        // Insert packages
        console.log('📦 Inserting packages...');
        const insertedPackages = await Package.insertMany(packages);
        console.log(`✅ ${insertedPackages.length} packages inserted\n`);

        // Create default admin
        console.log('👤 Creating default admin...');
        const admin = await Admin.create({
            username: process.env.ADMIN_USERNAME || 'admin',
            email: process.env.ADMIN_EMAIL || 'admin@tripholiday.com',
            password: process.env.ADMIN_PASSWORD || 'Admin@123',
            name: process.env.ADMIN_NAME || 'Administrator',
            role: 'superadmin'
        });
        console.log(`✅ Admin created:`);
        console.log(`   Username: ${admin.username}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
        console.log(`   Role: ${admin.role}\n`);

        console.log('🎉 Database seeded successfully!\n');
        console.log('📊 Summary:');
        console.log(`   - ${insertedPackages.length} packages`);
        console.log(`   - 1 admin user`);
        console.log('\n💡 You can now start the server with: npm start');
        console.log('🔐 Login at: http://localhost:5000/admin\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

// Run seed
seedDatabase();
