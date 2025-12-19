const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http'); 
const WebSocket = require('ws'); 
const path = require('path'); // ADD THIS LINE
const adminRoutes = require('./routes/admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== Home Route =====
app.get("/", (req, res) => {
  res.send("Srilu FashionHub Backend is Running Successfully!");
});

// ===== Create HTTP server =====
const server = http.createServer(app);

// ===== WebSocket server =====
const wss = new WebSocket.Server({ 
  server: server,
  path: '/ws'
});

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Admin Routes =====
app.use('/api/admin', adminRoutes);

// ===== MongoDB Connection =====
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('✅ Connected to MongoDB Database: srilufashionhub'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// Event listeners
mongoose.connection.on('connected', () => {
  console.log('📊 MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB connection disconnected');
});

// ===== WebSocket Setup =====
const connectedClients = new Map();

wss.on('connection', (ws, req) => {
  const clientId = Date.now() + Math.random().toString(36).substr(2, 9);
  connectedClients.set(clientId, ws);
  
  console.log(`🔌 WebSocket Client connected: ${clientId}`);
  console.log(`📡 Total connected clients: ${connectedClients.size}`);

  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to SriluFashionHub Live Tracking',
    clientId: clientId,
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'ping') {
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('❌ Error processing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    connectedClients.delete(clientId);
    console.log(`🔌 WebSocket Client disconnected: ${clientId}`);
  });

  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for client ${clientId}:`, error);
    connectedClients.delete(clientId);
  });
});

// ===== Broadcast Function =====
function broadcastCustomerActivity(activity) {
  const message = JSON.stringify({
    type: 'customer_activity',
    payload: activity,
    timestamp: new Date().toISOString()
  });

  connectedClients.forEach((client, clientId) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (error) {
        console.error(`❌ Error sending to client ${clientId}:`, error);
      }
    }
  });
}

// ===== Middleware for Customer Activity =====
app.use((req, res, next) => {
  const originalSend = res.send;

  res.send = function(data) {
    let parsedData;
    try { parsedData = typeof data === 'string' ? JSON.parse(data) : data; } 
    catch { parsedData = data; }

    if (shouldBroadcastActivity(req, parsedData)) {
      const activity = createActivityFromRequest(req, parsedData);
      if (activity) {
        setTimeout(() => broadcastCustomerActivity(activity), 100);
      }
    }

    originalSend.call(this, data);
  };

  next();
});

// ===== Helper Functions =====
function shouldBroadcastActivity(req, responseData) {
  const broadcastPaths = [
    '/api/users/cart',
    '/api/users/wishlist',
    '/api/users/orders',
    '/api/users/login',
    '/api/customers'
  ];

  return ['POST','PUT','DELETE'].includes(req.method) &&
         broadcastPaths.some(path => req.path.includes(path));
}

function createActivityFromRequest(req, responseData) {
  const path = req.path;
  const method = req.method;
  const userId = req.user?._id || req.body.userId || (responseData && (responseData.userId || responseData._id));
  const userName = req.user?.firstName || req.body.firstName || req.body.username || 'Unknown User';
  
  const activity = {
    type: 'unknown',
    userId,
    userName,
    timestamp: new Date().toISOString(),
    method,
    path
  };

  if (path.includes('/cart')) {
    if (method === 'POST') activity.type = 'cart_updated';
    else if (method === 'DELETE') activity.type = 'cart_item_removed';
    else if (method === 'PUT') activity.type = 'cart_quantity_updated';
  }
  else if (path.includes('/wishlist')) {
    if (method === 'POST') activity.type = 'wishlist_added';
    else if (method === 'DELETE') activity.type = 'wishlist_removed';
  }
  else if (path.includes('/orders') && method === 'POST') activity.type = 'order_placed';
  else if (path.includes('/login') && method === 'POST') activity.type = 'user_login';
  else if (path.includes('/customers') && method === 'PUT' && path.includes('/status')) activity.type = 'customer_status_changed';

  if (responseData && typeof responseData === 'object') {
    activity.data = {
      success: responseData.success,
      message: responseData.message,
      orderId: responseData.orderId || responseData._id,
      amount: responseData.totalAmount || responseData.amount,
      itemCount: responseData.quantity || responseData.items?.length
    };
  }

  return activity;
}

// ===== API Routes =====
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/user'));
app.use('/api/products', require('./routes/products'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/customers', require('./routes/customer'));

app.get('/api', (req, res) => {
  res.json({ 
    message: '👑 Welcome to SriluFashionHub API',
    version: '1.0.0',
    websocket: `ws://localhost:${PORT}/ws`
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    websocket_clients: connectedClients.size
  });
});

app.post('/api/test/broadcast', (req, res) => {
  const { type = 'test_activity', message = 'Test message', userId = 'test_user' } = req.body;
  const testActivity = {
    type,
    userId,
    userName: 'Test User',
    timestamp: new Date().toISOString(),
    data: { message, test: true }
  };
  broadcastCustomerActivity(testActivity);
  res.json({ success: true, message: 'Test broadcast sent', activity: testActivity, clientsCount: connectedClients.size });
});

// IMPORTANT: Move static file serving to the END, after all API routes
// Serve static files from React frontend
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Catch-all route to serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

// ===== Error Handling =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Something went wrong!' });
});

// ===== Start Server =====
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 HTTP: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// ===== Graceful Shutdown =====
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.close(1000, 'Server shutting down');
  });
  mongoose.connection.close(false, () => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});
