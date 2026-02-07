const mongoose = require('mongoose');
const User = require('../models/User.model');
require('dotenv').config();

/**
 * Make a user admin by email
 * Usage: node utils/makeUserAdmin.js user@email.com
 */

const makeUserAdmin = async (email) => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        if (!email) {
            console.error('❌ Please provide an email address');
            console.log('Usage: node utils/makeUserAdmin.js user@email.com');
            process.exit(1);
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.error(`❌ User with email "${email}" not found`);
            console.log('\nAvailable users:');
            const allUsers = await User.find({}).select('email firstName lastName role');
            allUsers.forEach(u => {
                console.log(`  - ${u.email} (${u.firstName} ${u.lastName}) - Role: ${u.role}`);
            });
            process.exit(1);
        }

        console.log(`\n📋 Found user: ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Current Role: ${user.role}`);

        if (user.role === 'admin' || user.role === 'super_admin') {
            console.log(`\n✅ User already has admin privileges (${user.role})`);
            process.exit(0);
        }

        // Update role to admin
        user.role = 'admin';
        await user.save();

        console.log(`\n✅ SUCCESS! User role updated to: admin`);
        console.log(`\n🎉 ${user.firstName} ${user.lastName} is now an admin!`);
        console.log(`\nThey can now access:`);
        console.log(`  - Admin Dashboard: /admin-dashboard.html`);
        console.log(`\n⚠️  NOTE: User must logout and login again for changes to take effect.`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

// Get email from command line arguments
const email = process.argv[2];
makeUserAdmin(email);
