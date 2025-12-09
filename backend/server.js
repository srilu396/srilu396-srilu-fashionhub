const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http'); 
const WebSocket = require('ws'); 
const adminRoutes = require('./routes/admin');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;



// Create HTTP server
const server = http.createServer(app); // CHANGE THIS LINE

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server: server, // Use the same server
  path: '/ws' // WebSocket endpoint
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//admin Customer Management
app.use('/api/admin', adminRoutes);

// Connect to MongoDB with better error handling
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('✅ Connected to MongoDB Database: srilufashionhub'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  console.log('💡 Please make sure MongoDB is running on your system');
  console.log('💡 Run: mongod (or) sudo systemctl start mongod');
});

// Add connection event listeners
mongoose.connection.on('connected', () => {
  console.log('📊 MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB connection disconnected');
});

// ==================== WEBSOCKET SETUP ====================

// Store connected clients
const connectedClients = new Map();

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const clientId = Date.now() + Math.random().toString(36).substr(2, 9);
  connectedClients.set(clientId, ws);
  
  console.log(`🔌 WebSocket Client connected: ${clientId}`);
  console.log(`📡 Total connected clients: ${connectedClients.size}`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to SriluFashionHub Live Tracking',
    clientId: clientId,
    timestamp: new Date().toISOString()
  }));

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Handle ping/pong for connection keep-alive
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

  // Handle client disconnection
  ws.on('close', () => {
    connectedClients.delete(clientId);
    console.log(`🔌 WebSocket Client disconnected: ${clientId}`);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for client ${clientId}:`, error);
    connectedClients.delete(clientId);
  });
});

// Function to broadcast activity to all connected clients
function broadcastCustomerActivity(activity) {
  const data = {
    type: 'customer_activity',
    payload: activity,
    timestamp: new Date().toISOString()
  };
  
  const message = JSON.stringify(data);
  
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

// Middleware to intercept customer activities and broadcast them
app.use((req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Try to parse the response data
    let parsedData;
    try {
      parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    } catch {
      parsedData = data;
    }
    
    // Check if this is a customer activity that should be broadcasted
    if (shouldBroadcastActivity(req, parsedData)) {
      const activity = createActivityFromRequest(req, parsedData);
      if (activity) {
        // Broadcast after a short delay to not block response
        setTimeout(() => {
          broadcastCustomerActivity(activity);
        }, 100);
      }
    }
    
    // Call original send function
    originalSend.call(this, data);
  };
  
  next();
});

// Helper function to determine if an activity should be broadcasted
function shouldBroadcastActivity(req, responseData) {
  const path = req.path;
  const method = req.method;
  
  // Broadcast activities from these endpoints
  const broadcastPaths = [
    '/api/users/cart',
    '/api/users/wishlist',
    '/api/users/orders',
    '/api/users/login',
    '/api/customers'
  ];
  
  // Only broadcast successful POST, PUT, DELETE requests
  if (!['POST', 'PUT', 'DELETE'].includes(method)) return false;
  
  // Check if path matches any broadcast path
  return broadcastPaths.some(broadcastPath => path.includes(broadcastPath));
}

// Helper function to create activity object from request
function createActivityFromRequest(req, responseData) {
  const path = req.path;
  const method = req.method;
  
  // Extract user info from request (adjust based on your auth middleware)
  const userId = req.user?._id || req.body.userId || 
                (responseData && (responseData.userId || responseData._id));
  
  const userName = req.user?.firstName || req.body.firstName || 
                  req.body.username || 'Unknown User';
  
  const activity = {
    type: 'unknown',
    userId: userId,
    userName: userName,
    timestamp: new Date().toISOString(),
    method: method,
    path: path
  };
  
  // Determine activity type based on route
  if (path.includes('/cart')) {
    if (method === 'POST') activity.type = 'cart_updated';
    else if (method === 'DELETE') activity.type = 'cart_item_removed';
    else if (method === 'PUT') activity.type = 'cart_quantity_updated';
  }
  else if (path.includes('/wishlist')) {
    if (method === 'POST') activity.type = 'wishlist_added';
    else if (method === 'DELETE') activity.type = 'wishlist_removed';
  }
  else if (path.includes('/orders')) {
    if (method === 'POST') activity.type = 'order_placed';
  }
  else if (path.includes('/login')) {
    if (method === 'POST') activity.type = 'user_login';
  }
  else if (path.includes('/customers')) {
    if (method === 'PUT' && path.includes('/status')) {
      activity.type = 'customer_status_changed';
    }
  }
  
  // Add response data if available
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

// ==================== YOUR EXISTING ROUTES ====================

// Routes
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/user'));
app.use('/api/products', require('./routes/products'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/customers', require('./routes/customer')); // Your customer routes

// Basic routes
app.get('/api', (req, res) => {
  res.json({ 
    message: '👑 Welcome to SriluFashionHub API',
    version: '1.0.0',
    websocket: `ws://localhost:${PORT}/ws` // Add WebSocket info
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    websocket_clients: connectedClients.size
  });
});

// WebSocket test endpoint
app.post('/api/test/broadcast', (req, res) => {
  const { type = 'test_activity', message = 'Test message', userId = 'test_user' } = req.body;
  
  const testActivity = {
    type: type,
    userId: userId,
    userName: 'Test User',
    timestamp: new Date().toISOString(),
    data: {
      message: message,
      test: true
    }
  };
  
  broadcastCustomerActivity(testActivity);
  
  res.json({
    success: true,
    message: 'Test broadcast sent',
    activity: testActivity,
    clientsCount: connectedClients.size
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    status: 'error', 
    message: 'Something went wrong!' 
  });
});

// Serve static files from React app
app.use(express.static(path.join(__dirname, '../frontend/build')));

// The "catchall" handler
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Start server
server.listen(PORT, () => { // CHANGE THIS LINE TOO
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 HTTP: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  
  // Close all WebSocket connections
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.close(1000, 'Server shutting down');
    }
  });
  
  // Close MongoDB connection
  mongoose.connection.close(false, () => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});