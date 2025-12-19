# 🛍️ SriLu FashionHub - MERN E-Commerce Platform

![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue)
![Status](https://img.shields.io/badge/Status-Live-success)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌐 Live Demo
**Frontend:** https://srilu-fashionhub-frontend.vercel.app/  
**Backend:** https://srilu-fashionhub-backend.onrender.com

## 📖 Overview
SriLu FashionHub is a modern, full-featured e-commerce platform built with the MERN stack (MongoDB, Express.js, React, Node.js). This application provides a seamless shopping experience for customers while offering powerful management tools for administrators. With a sleek design, intuitive interface, and robust functionality, it's designed to handle everything from product browsing to order fulfillment. 🚀

## ✨ Key Features

### 🛍️ Customer-Facing Features
- **👤 User Authentication** - Secure login/registration with JWT tokens
- **🔍 Product Discovery** - Advanced search, filters, and category navigation
- **🛒 Smart Shopping Cart** - Add/remove items with real-time quantity updates
- **❤️ Personal Wishlist** - Save favorite products for future purchases
- **💳 Secure Checkout** - Complete order processing with payment integration
- **📦 Order Tracking** - Real-time status updates and history
- **🎫 Coupon System** - Apply discount codes during checkout
- **👤 User Dashboard** - Manage profile, addresses, and preferences
- **📱 Responsive Design** - Optimized for desktop, tablet, and mobile

### 👨‍💼 Admin Dashboard Features
- **📊 Analytics Dashboard** - Sales insights and performance metrics
- **🛍️ Product Management** - Full CRUD operations for product catalog
- **📋 Order Management** - Process, update, and track customer orders
- **👥 Customer Management** - View user profiles and activity
- **🎫 Coupon Management** - Create and manage promotional offers
- **⚙️ Store Configuration** - Customize platform settings
- **💬 Support Center** - Manage customer inquiries and messages
- **📈 Business Reports** - Generate sales and inventory reports

## 🛠️ Technology Stack

### 🔙 Backend
- **🟢 Node.js** - JavaScript runtime environment
- **🚂 Express.js** - Fast, minimalist web framework
- **🍃 MongoDB** - NoSQL database for flexibility
- **🐪 Mongoose** - Elegant MongoDB object modeling
- **🔐 JWT** - Secure authentication and authorization
- **🛡️ Bcrypt** - Password hashing for security
- **🌐 CORS** - Cross-origin resource sharing
- **📝 Dotenv** - Environment configuration

### 🔜 Frontend
- **⚛️ React** - Component-based UI library
- **🔄 Redux Toolkit** - Predictable state container
- **🧭 React Router** - Declarative routing system
- **📡 Axios** - Promise-based HTTP client
- **🎨 CSS3** - Modern styling with animations
- **🎯 Context API** - Additional state management
- **🎣 Custom Hooks** - Reusable React logic

### 🛠️ Development Tools
- **📦 NPM** - Package management
- **🐙 Git & GitHub** - Version control
- **📬 Postman** - API testing and documentation
- **💻 VS Code** - Integrated development environment

## 🚀 Quick Installation

### 📋 Prerequisites
- 🟢 Node.js (v14 or higher)
- 🍃 MongoDB (local or MongoDB Atlas)
- 📦 npm or yarn package manager

### 🔙 Backend Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/srilu-fashionhub.git
cd srilu-fashionhub/backend

# Install dependencies
npm install

# Configure environment variables
# Create .env file with your configurations

# Start the server
npm start
# Development mode
npm run dev
```

### 🔜 Frontend Setup
```bash
cd ../frontend
npm install
npm start
```

## ⚙️ Environment Configuration

### Backend (.env)
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secure_jwt_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure_password_here
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X
```

## 🔌 API Highlights

### 🔐 Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin/login` - Admin authentication
- `GET /api/auth/me` - Get current user profile

### 🛍️ Products
- `GET /api/products` - Browse products with filters
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Add new product (Admin)
- `PUT /api/products/:id` - Update product (Admin)

### 📦 Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - View user orders
- `GET /api/orders/all` - All orders (Admin)
- `PUT /api/orders/:id` - Update order status (Admin)

### 🛒 Cart Management
- `GET /api/cart` - View shopping cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart quantity
- `DELETE /api/cart/:id` - Remove from cart

### 🎫 Coupon System
- `GET /api/coupons` - List available coupons
- `POST /api/coupons` - Create coupon (Admin)
- `POST /api/coupons/validate` - Validate coupon code
- `DELETE /api/coupons/:id` - Remove coupon (Admin)

## 🏗️ Key Technical Features

### 🎯 State Management
- **🔄 Redux Toolkit** for centralized application state
- **🎯 Context API** for theme and authentication providers
- **💾 Local Storage** for persisting user sessions
- **⚡ Optimized re-renders** with memoization

### 🔒 Security Implementation
- **🔐 JWT-based authentication** with token refresh
- **🛡️ Password encryption** using bcrypt
- **🔑 Role-based access control** (User/Admin)
- **✅ Input validation** and sanitization
- **🌐 CORS configuration** for API security

### ⚡ Performance Optimization
- **🚀 Code splitting** for faster initial loads
- **🖼️ Lazy loading** of images and components
- **🔍 Debounced search** for better UX
- **💾 Efficient caching** strategies
- **📱 Responsive images** for different devices

## 🤝 Contributing Guidelines

We welcome contributions! Here's how you can help:

1. **🍴 Fork the repository**
2. **🌿 Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **💾 Commit your changes:** `git commit -m 'Add amazing feature'`
4. **📤 Push to the branch:** `git push origin feature/amazing-feature`
5. **🔀 Open a Pull Request**

### 📝 Code Standards
- Follow existing code style and structure
- Add comments for complex logic
- Update documentation as needed
- Test your changes thoroughly
- Ensure no console logs in production code

## 📄 License

This project is licensed under the **MIT License** - see the LICENSE file for details. 📜

## 🙏 Acknowledgments

- Built with love using the amazing MERN stack ecosystem ❤️
- Inspired by modern e-commerce platforms and best practices 🛍️
- Special thanks to all open-source contributors and libraries 🙌

## 📞 Support & Contact

For support, questions, or feedback:
- 📧 Open an issue in the GitHub repository
- 🔧 Check the API documentation for technical queries
- 💬 Review existing issues before creating new ones
- 🌟 Star the repo if you find it helpful!

