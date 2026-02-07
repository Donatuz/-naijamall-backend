const User = require('../models/User.model');

/**
 * Seeds a super admin user if one doesn't exist
 * This function should be called on server startup
 */
const seedSuperAdmin = async () => {
    try {
        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
        
        if (!superAdminEmail) {
            console.log('⚠️  SUPER_ADMIN_EMAIL not set in environment variables. Skipping super admin seeding.');
            return;
        }

        // Check if super admin already exists
        const existingSuperAdmin = await User.findOne({ email: superAdminEmail });
        
        if (existingSuperAdmin) {
            // Update role if user exists but isn't super_admin yet
            if (existingSuperAdmin.role !== 'super_admin') {
                existingSuperAdmin.role = 'super_admin';
                await existingSuperAdmin.save();
                console.log(`✅ Updated existing user ${superAdminEmail} to super_admin role`);
            } else {
                console.log(`✅ Super admin already exists: ${superAdminEmail}`);
            }
            return;
        }

        // Create new super admin
        const superAdmin = await User.create({
            email: superAdminEmail,
            password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123',
            firstName: process.env.SUPER_ADMIN_FIRST_NAME || 'Super',
            lastName: process.env.SUPER_ADMIN_LAST_NAME || 'Admin',
            phone: process.env.SUPER_ADMIN_PHONE || '+2348000000000',
            role: 'super_admin',
            isActive: true,
            isEmailVerified: true
        });

        console.log(`✅ Super admin created successfully: ${superAdmin.email}`);
        console.log(`   Name: ${superAdmin.firstName} ${superAdmin.lastName}`);
        console.log(`   Role: ${superAdmin.role}`);
        
    } catch (error) {
        console.error('❌ Error seeding super admin:', error.message);
    }
};

module.exports = seedSuperAdmin;
