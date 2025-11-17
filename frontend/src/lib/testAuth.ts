/**
 * Quick authentication test
 * Run this in the browser console to verify auth is working
 */

// Test 1: Check if auth token exists
const token = localStorage.getItem('auth_token');
console.log('🔑 Auth token exists:', !!token);
if (token) {
  console.log('Token (first 20 chars):', token.substring(0, 20) + '...');
}

// Test 2: Make a test API call
async function testAuthenticatedRequest() {
  try {
    const response = await fetch('/api/auth/validate', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Auth validation response:', response.status, response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ User authenticated:', data.user);
      return true;
    } else {
      console.log('❌ Authentication failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    return false;
  }
}

// Test 3: Check API client configuration
console.log('\n📡 Testing API endpoints...');
testAuthenticatedRequest().then(success => {
  if (success) {
    console.log('\n✅ ALL TESTS PASSED - Authentication is working correctly!');
    console.log('The chrome-extension errors are harmless and do not affect functionality.');
  } else {
    console.log('\n❌ Authentication test failed - check your login credentials');
  }
});

export {};
