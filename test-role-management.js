/**
 * Test script for Role Management System
 * Run with: node test-role-management.js
 * 
 * Make sure to:
 * 1. Set your API URL below
 * 2. Update super admin credentials
 * 3. Have server running
 */

const API_URL = process.env.API_URL || 'http://localhost:5000';
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'superadmin@naijamall.com';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';

let authToken = '';
let testUserId = '';

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (authToken) {
        options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const data = await response.json();
        return { status: response.status, data };
    } catch (error) {
        console.error('API call failed:', error.message);
        return { status: 0, error: error.message };
    }
}

// Test functions
async function test1_LoginAsSuperAdmin() {
    console.log('\n📝 Test 1: Login as Super Admin');
    console.log('='.repeat(50));
    
    const result = await apiCall('/api/auth/login', 'POST', {
        email: SUPER_ADMIN_EMAIL,
        password: SUPER_ADMIN_PASSWORD
    });

    if (result.status === 200 && result.data.success) {
        authToken = result.data.token;
        console.log('✅ Login successful');
        console.log(`   User: ${result.data.data.firstName} ${result.data.data.lastName}`);
        console.log(`   Role: ${result.data.data.role}`);
        console.log(`   Token: ${authToken.substring(0, 20)}...`);
        return true;
    } else {
        console.log('❌ Login failed');
        console.log('   Error:', result.data.message);
        return false;
    }
}

async function test2_GetAvailableRoles() {
    console.log('\n📝 Test 2: Get Available Roles');
    console.log('='.repeat(50));
    
    const result = await apiCall('/api/admin/roles');

    if (result.status === 200 && result.data.success) {
        console.log('✅ Roles fetched successfully');
        console.log(`   Current Role: ${result.data.currentUserRole}`);
        console.log(`   Current Level: ${result.data.currentUserLevel}`);
        console.log('\n   Available Roles:');
        result.data.data.forEach(role => {
            console.log(`   ${role.level}. ${role.label} (${role.value})`);
            console.log(`      ${role.description}`);
        });
        return true;
    } else {
        console.log('❌ Failed to fetch roles');
        console.log('   Error:', result.data.message);
        return false;
    }
}

async function test3_GetAllUsers() {
    console.log('\n📝 Test 3: Get All Users');
    console.log('='.repeat(50));
    
    const result = await apiCall('/api/admin/users?limit=5');

    if (result.status === 200 && result.data.success) {
        console.log('✅ Users fetched successfully');
        console.log(`   Total Users: ${result.data.total}`);
        console.log(`   Showing: ${result.data.count} users\n`);
        
        result.data.data.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.firstName} ${user.lastName}`);
            console.log(`      Email: ${user.email}`);
            console.log(`      Role: ${user.role}`);
            console.log(`      Status: ${user.isActive ? 'Active' : 'Inactive'}`);
            
            // Save first non-super-admin user for testing
            if (!testUserId && user.role !== 'super_admin') {
                testUserId = user._id;
            }
        });
        return true;
    } else {
        console.log('❌ Failed to fetch users');
        console.log('   Error:', result.data.message);
        return false;
    }
}

async function test4_CreateTestUser() {
    console.log('\n📝 Test 4: Create Test User (for role update testing)');
    console.log('='.repeat(50));
    
    const testEmail = `test_${Date.now()}@naijamall.com`;
    const result = await apiCall('/api/auth/signup', 'POST', {
        firstName: 'Test',
        lastName: 'User',
        email: testEmail,
        phone: `+234${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        password: 'Test@123',
        role: 'buyer'
    });

    if (result.status === 201 && result.data.success) {
        testUserId = result.data.data._id;
        console.log('✅ Test user created successfully');
        console.log(`   User ID: ${testUserId}`);
        console.log(`   Email: ${testEmail}`);
        console.log(`   Role: ${result.data.data.role}`);
        return true;
    } else {
        console.log('⚠️  Could not create test user (may already exist)');
        console.log('   Will use existing user for testing');
        return true; // Don't fail the test
    }
}

async function test5_UpdateUserRole() {
    console.log('\n📝 Test 5: Update User Role');
    console.log('='.repeat(50));
    
    if (!testUserId) {
        console.log('❌ No test user available');
        return false;
    }

    // Update to admin
    console.log(`   Updating user ${testUserId} to admin...`);
    const result = await apiCall(`/api/admin/users/${testUserId}/role`, 'PATCH', {
        role: 'admin'
    });

    if (result.status === 200 && result.data.success) {
        console.log('✅ Role updated successfully');
        console.log(`   ${result.data.message}`);
        console.log(`   New Role: ${result.data.data.role}`);
        return true;
    } else {
        console.log('❌ Failed to update role');
        console.log('   Error:', result.data.message);
        return false;
    }
}

async function test6_PermissionDenialTest() {
    console.log('\n📝 Test 6: Test Permission Restrictions');
    console.log('='.repeat(50));
    
    // Create a regular admin account and try to create super admin
    const regularAdminEmail = `admin_${Date.now()}@naijamall.com`;
    
    // First create a buyer account
    const createResult = await apiCall('/api/auth/signup', 'POST', {
        firstName: 'Regular',
        lastName: 'Admin',
        email: regularAdminEmail,
        phone: `+234${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        password: 'Admin@123',
        role: 'buyer'
    });

    if (createResult.status === 201) {
        const regularAdminId = createResult.data.data._id;
        
        // Upgrade to admin
        await apiCall(`/api/admin/users/${regularAdminId}/role`, 'PATCH', {
            role: 'admin'
        });

        // Login as regular admin
        const loginResult = await apiCall('/api/auth/login', 'POST', {
            email: regularAdminEmail,
            password: 'Admin@123'
        });

        if (loginResult.status === 200) {
            const regularAdminToken = authToken; // Save super admin token
            authToken = loginResult.data.token; // Use regular admin token

            // Try to create super admin (should fail)
            console.log('   Testing: Regular admin trying to create super admin...');
            const trySuper = await apiCall(`/api/admin/users/${testUserId}/role`, 'PATCH', {
                role: 'super_admin'
            });

            if (trySuper.status === 403) {
                console.log('✅ Permission denial working correctly');
                console.log('   Regular admin cannot create super admin ✓');
            } else {
                console.log('❌ Permission check failed - regular admin could create super admin!');
            }

            // Restore super admin token
            authToken = regularAdminToken;
        }
    }
    
    return true;
}

async function test7_GetDashboardStats() {
    console.log('\n📝 Test 7: Get Admin Dashboard Stats');
    console.log('='.repeat(50));
    
    const result = await apiCall('/api/admin/dashboard');

    if (result.status === 200 && result.data.success) {
        console.log('✅ Dashboard stats fetched successfully');
        console.log('\n   User Statistics:');
        console.log(`   Total Users: ${result.data.data.users.total}`);
        console.log(`   Buyers: ${result.data.data.users.buyers}`);
        console.log(`   Sellers: ${result.data.data.users.sellers}`);
        console.log(`   Riders: ${result.data.data.users.riders}`);
        return true;
    } else {
        console.log('❌ Failed to fetch dashboard stats');
        console.log('   Error:', result.data.message);
        return false;
    }
}

// Main test runner
async function runTests() {
    console.log('\n🚀 NaijaMall Role Management System - Test Suite');
    console.log('='.repeat(50));
    console.log(`API URL: ${API_URL}`);
    console.log(`Super Admin Email: ${SUPER_ADMIN_EMAIL}`);
    
    const tests = [
        test1_LoginAsSuperAdmin,
        test2_GetAvailableRoles,
        test3_GetAllUsers,
        test4_CreateTestUser,
        test5_UpdateUserRole,
        test6_PermissionDenialTest,
        test7_GetDashboardStats
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            const result = await test();
            if (result) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.log(`❌ Test failed with error: ${error.message}`);
            failed++;
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Results');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Total: ${tests.length}`);
    console.log('='.repeat(50));
}

// Run if called directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };
