const http = require('http');

// Test API function
function testAPI(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // attach auth token if available
    if (global.__authToken) {
      options.headers.Authorization = `Bearer ${global.__authToken}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Test suite
async function runTests() {
  console.log('\n========== FLIGHT BOOKING SYSTEM TEST SUITE ==========\n');
  
  try {
    // TEST 1: Seed Flights
    console.log('TEST 1: Seeding Flights...');
    const seedRes = await testAPI('/api/flights/seed', 'POST');
    console.log(`Status: ${seedRes.status}`);
    console.log(`Response:`, seedRes.data);
    if (seedRes.status === 200 || seedRes.status === 201) {
      console.log('✅ PASS: Flight seeding successful\n');
    } else {
      console.log('❌ FAIL: Flight seeding failed\n');
    }

    // TEST 2: Get All Flights
    console.log('TEST 2: Get All Flights...');
    const flightsRes = await testAPI('/api/flights', 'GET');
    console.log(`Status: ${flightsRes.status}`);
    console.log(`Number of flights: ${flightsRes.data.data?.length || 0}`);
    if (flightsRes.status === 200 && flightsRes.data.data?.length > 0) {
      console.log('✅ PASS: Retrieved flights');
      console.log(`First flight: ${flightsRes.data.data[0].airline} - ${flightsRes.data.data[0].departure_city} → ${flightsRes.data.data[0].arrival_city}\n`);
    } else {
      console.log('❌ FAIL: Could not retrieve flights\n');
    }

    // TEST 3: Search Flights
    console.log('TEST 3: Search Flights (Delhi to Mumbai)...');
    const searchRes = await testAPI('/api/flights/search?from=Delhi&to=Mumbai', 'GET');
    console.log(`Status: ${searchRes.status}`);
    console.log(`Results found: ${searchRes.data.data?.length || 0}`);
    if (searchRes.status === 200) {
      console.log('✅ PASS: Flight search working\n');
    } else {
      console.log('❌ FAIL: Flight search failed\n');
    }

    // Create and login a temporary test user to exercise authenticated endpoints
    console.log('TEST 3.5: Register and login test user...');
    const uniqueEmail = `test_user_${Date.now()}@example.com`;
    const registerRes = await testAPI('/api/auth/register', 'POST', {
      name: 'Test User',
      email: uniqueEmail,
      password: 'password123',
      confirmPassword: 'password123'
    });
    if (registerRes.status === 201 && registerRes.data.token) {
      console.log('✅ PASS: Registered test user');
      // Login to get token
      const loginRes = await testAPI('/api/auth/login', 'POST', { email: uniqueEmail, password: 'password123' });
      if (loginRes.status === 200 && loginRes.data.token) {
        global.__authToken = loginRes.data.token;
        console.log('✅ PASS: Logged in test user (token acquired)\n');
      } else {
        console.log('❌ FAIL: Could not login test user');
      }
    } else {
      console.log('❌ FAIL: Could not register test user');
    }

    // TEST 4: Get Wallet Balance
    console.log('TEST 4: Get Wallet Balance...');
    // Wallet endpoint expects a query parameter `userId` (e.g. /api/wallet?userId=...)
    const walletRes = await testAPI('/api/wallet?userId=user123', 'GET');
    console.log(`Status: ${walletRes.status}`);
    console.log(`Response:`, walletRes.data);
    if (walletRes.status === 200) {
      console.log('✅ PASS: Wallet endpoint working\n');
    } else {
      console.log('❌ FAIL: Wallet endpoint failed\n');
    }

    // TEST 5: Create Booking
    console.log('TEST 5: Create Booking...');
    // Use a valid flight_id from the flights response instead of a hard-coded unknown id
    const flightIdToBook = flightsRes.data.data && flightsRes.data.data.length > 0 ? flightsRes.data.data[0].flight_id : 'FL001';
    const bookingData = {
      userId: 'user123',
      flightId: flightIdToBook,
      passengerName: 'Test Passenger'
    };
    const bookingRes = await testAPI('/api/bookings', 'POST', bookingData);
    console.log(`Status: ${bookingRes.status}`);
    if (bookingRes.status === 201) {
      console.log('✅ PASS: Booking created successfully');
      console.log(`PNR: ${bookingRes.data.booking.pnr}`);
      console.log(`Price paid: ₹${bookingRes.data.booking.price_paid}\n`);
    } else {
      console.log('❌ FAIL: Booking creation failed');
      console.log(`Error: ${bookingRes.data.message || JSON.stringify(bookingRes.data)}\n`);
    }

    // TEST 6: Get My Bookings
    console.log('TEST 6: Get My Bookings...');
    // Booking list endpoint accepts query parameter `userId` (e.g. /api/bookings?userId=...)
    const myBookingsRes = await testAPI('/api/bookings?userId=user123', 'GET');
    console.log(`Status: ${myBookingsRes.status}`);
    console.log(`Number of bookings: ${myBookingsRes.data.data?.length || 0}`);
    if (myBookingsRes.status === 200) {
      console.log('✅ PASS: Retrieved bookings\n');
    } else {
      console.log('❌ FAIL: Could not retrieve bookings\n');
    }

    console.log('========== TEST SUITE COMPLETED ==========\n');

  } catch (error) {
    console.error('❌ TEST ERROR:', error);
  }
}

// Run tests after a short delay to ensure server is ready
setTimeout(() => {
  runTests().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}, 2000);
