// Test script to validate API fixes
// Run this to test that all modules are properly connected to live data

console.log('🧪 Testing Farm Management System API Integration Fixes');
console.log('='.repeat(60));

async function testAPIEndpoints() {
  const baseUrl = 'https://5f267762.farmers-boot.pages.dev';
  
  console.log('\n📋 Testing Endpoint Availability:');
  console.log('-'.repeat(40));
  
  // Test 1: Check if migrate endpoint exists
  console.log('\n1. Testing Migration Endpoint...');
  try {
    const migrateResponse = await fetch(`${baseUrl}/api/migrate`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (migrateResponse.status === 200 || migrateResponse.status === 405) {
      console.log('✅ Migration endpoint is accessible');
    } else {
      console.log(`❌ Migration endpoint returned status: ${migrateResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Migration endpoint error: ${error.message}`);
  }
  
  // Test 2: Check if seed endpoint exists
  console.log('\n2. Testing Seed Endpoint...');
  try {
    const seedResponse = await fetch(`${baseUrl}/api/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (seedResponse.status === 200 || seedResponse.status === 405) {
      console.log('✅ Seed endpoint is accessible');
    } else {
      console.log(`❌ Seed endpoint returned status: ${seedResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Seed endpoint error: ${error.message}`);
  }
  
  // Test 3: Check animals endpoint (should now work)
  console.log('\n3. Testing Animals API Endpoint...');
  try {
    const animalsResponse = await fetch(`${baseUrl}/api/animals`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`Animals API Status: ${animalsResponse.status}`);
    
    if (animalsResponse.status === 200) {
      const data = await animalsResponse.json();
      console.log(`✅ Animals API working! Found ${data.animals?.length || 0} animals`);
    } else if (animalsResponse.status === 401) {
      console.log('⚠️ Animals API requires authentication (expected)');
    } else if (animalsResponse.status === 500) {
      console.log('❌ Animals API still returning 500 - schema not applied');
      const errorText = await animalsResponse.text();
      console.log('Error details:', errorText.substring(0, 200));
    } else {
      console.log(`⚠️ Animals API returned unexpected status: ${animalsResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Animals API error: ${error.message}`);
  }
  
  console.log('\n📝 Instructions for Manual Testing:');
  console.log('-'.repeat(40));
  console.log('1. Open your browser to: https://5f267762.farmers-boot.pages.dev');
  console.log('2. Login with your credentials');
  console.log('3. Navigate to the Animals page');
  console.log('4. Check browser console for errors');
  console.log('5. Apply migration if needed: POST to /api/migrate');
  console.log('\n🎯 Expected Results After Fix:');
  console.log('- Animals page loads without 500 errors');
  console.log('- API calls return live data instead of static');
  console.log('- No database schema errors in console');
  console.log('- CRUD operations work properly');
}

// Run the tests
testAPIEndpoints().catch(console.error);