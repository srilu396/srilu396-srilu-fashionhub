const http = require('http');
require('dotenv').config();

const API_BASE = 'http://localhost:5001';

async function makeRequest(method, urlPath, body = null, headers = {}) {
  return new Promise((resolve) => {
    const url = new URL(urlPath, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 0, error: err.message });
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 STARTING API & MONGO DB CRUD AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  const results = [];

  // 1. Root
  const r1 = await makeRequest('GET', '/');
  results.push({ name: 'GET / (Home)', status: r1.status, pass: r1.status === 200, response: r1.data });

  // 2. Health
  const r2 = await makeRequest('GET', '/api/health');
  results.push({ name: 'GET /api/health', status: r2.status, pass: r2.status === 200, response: r2.data });

  // 3. API Info
  const r3 = await makeRequest('GET', '/api');
  results.push({ name: 'GET /api', status: r3.status, pass: r3.status === 200, response: r3.data });

  // 4. Products List
  const r4 = await makeRequest('GET', '/api/products');
  results.push({ name: 'GET /api/products', status: r4.status, pass: r4.status === 200, response: { count: r4.data?.count, productsCount: r4.data?.products?.length } });

  // 5. Products Categories
  const r5 = await makeRequest('GET', '/api/products?category=dresses');
  results.push({ name: 'GET /api/products?category=dresses', status: r5.status, pass: r5.status === 200, response: { count: r5.data?.count } });

  // 6. User Registration Test
  const testUserEmail = `testuser_${Date.now()}@srilufashionhub.com`;
  const r6 = await makeRequest('POST', '/api/users/register', {
    username: `user_${Date.now()}`,
    email: testUserEmail,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User'
  });
  results.push({ name: 'POST /api/users/register', status: r6.status, pass: r6.status === 201, response: r6.data });

  // 7. User Login Test
  const r7 = await makeRequest('POST', '/api/users/login', {
    email: testUserEmail,
    password: 'TestPassword123!'
  });
  results.push({ name: 'POST /api/users/login', status: r7.status, pass: r7.status === 200 && !!r7.data?.token, response: { success: r7.data?.success, tokenReceived: !!r7.data?.token, user: r7.data?.user } });
  const userToken = r7.data?.token;

  // 8. User Profile (Protected Route)
  if (userToken) {
    const r8 = await makeRequest('GET', '/api/users/profile', null, { 'Authorization': `Bearer ${userToken}` });
    results.push({ name: 'GET /api/users/profile (Auth Protected)', status: r8.status, pass: r8.status === 200, response: r8.data });
  }

  // 9. Admin Login Test
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@srilufashionhub.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'SriluF@sh1on@2024!';
  const r9 = await makeRequest('POST', '/api/users/login', {
    email: adminEmail,
    password: adminPassword
  });
  results.push({ name: 'POST /api/users/login (Admin Credentials)', status: r9.status, pass: r9.status === 200, response: { success: r9.data?.success, user: r9.data?.user } });

  // 10. Contact Message POST
  const r10 = await makeRequest('POST', '/api/messages', {
    name: 'Test Customer',
    email: 'customer@example.com',
    subject: 'Inquiry',
    message: 'Testing contact message flow.'
  });
  results.push({ name: 'POST /api/messages', status: r10.status, pass: r10.status === 201 || r10.status === 200, response: r10.data });

  // 11. GET Coupons
  const r11 = await makeRequest('GET', '/api/coupons');
  results.push({ name: 'GET /api/coupons', status: r11.status, pass: r11.status === 200, response: r11.data });

  // 12. Create Product (CRUD - Create)
  const newProductPayload = {
    name: `Silk Evening Gown ${Date.now()}`,
    description: 'A luxurious silk gown for special occasions',
    price: 499.99,
    originalPrice: 599.99,
    discount: 17,
    category: 'dresses',
    brand: 'Srilu Couture',
    images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f'],
    inventory: 25,
    rating: 4.9,
    isNew: true,
    featured: true
  };
  const r12 = await makeRequest('POST', '/api/products', newProductPayload);
  results.push({ name: 'POST /api/products (CRUD - Create)', status: r12.status, pass: r12.status === 201, response: r12.data });
  const createdProductId = r12.data?.product?._id;

  // 13. Read Single Product (CRUD - Read)
  if (createdProductId) {
    const r13 = await makeRequest('GET', `/api/products/${createdProductId}`);
    results.push({ name: `GET /api/products/${createdProductId} (CRUD - Read)`, status: r13.status, pass: r13.status === 200, response: r13.data });

    // 14. Update Product (CRUD - Update)
    const r14 = await makeRequest('PUT', `/api/products/${createdProductId}`, { price: 449.99 });
    results.push({ name: `PUT /api/products/${createdProductId} (CRUD - Update)`, status: r14.status, pass: r14.status === 200, response: r14.data });

    // 15. Delete Product (CRUD - Delete)
    const r15 = await makeRequest('DELETE', `/api/products/${createdProductId}`);
    results.push({ name: `DELETE /api/products/${createdProductId} (CRUD - Delete)`, status: r15.status, pass: r15.status === 200, response: r15.data });
  }

  console.log('====================================================');
  console.log('SUMMARY OF TEST RESULTS:');
  console.table(results.map(r => ({
    Endpoint: r.name,
    Status: r.status,
    Result: r.pass ? '✅ PASS' : '❌ FAIL'
  })));

  console.log('\nFULL JSON DETAILS:');
  console.log(JSON.stringify(results, null, 2));

  process.exit(0);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
