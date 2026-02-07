const mongoose = require('mongoose');
const User = require('../models/User.model');
require('dotenv').config();

const listAllUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const users = await User.find({}).select('email firstName lastName role createdAt');
        
        if (users.length === 0) {
            console.log('❌ No users found in database');
            process.exit(0);
        }

        console.log(`📋 Found ${users.length} user(s):\n`);
        console.log('================================================');
        
        users.forEach((user, index) => {
            console.log(`${index + 1}. Email: ${user.email}`);
            console.log(`   Name: ${user.firstName} ${user.lastName}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Registered: ${user.createdAt.toLocaleDateString()}`);
            console.log('------------------------------------------------');
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

listAllUsers();
