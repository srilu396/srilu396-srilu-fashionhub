# 🛍️ SriLu FashionHub - E-Commerce Platform

![E-Commerce Platform](https://img.shields.io/badge/Status-Active-success)
![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue)
![License](https://img.shields.io/badge/License-MIT-green)

![img alt](https://github.com/srilu396/srilu396-srilu-fashionhub/blob/e5f8e1fbf5d1a6de3c412ba5ccca70f0c3e26ebb/Screenshot%202025-12-11%20123429.png)
![img alt](https://github.com/srilu396/srilu396-srilu-fashionhub/blob/e5f8e1fbf5d1a6de3c412ba5ccca70f0c3e26ebb/Screenshot%202025-12-11%20123257.png)
![img alt](https://github.com/srilu396/srilu396-srilu-fashionhub/blob/e5f8e1fbf5d1a6de3c412ba5ccca70f0c3e26ebb/Screenshot%202025-12-11%20123329.png)
![img alt](https://github.com/srilu396/srilu396-srilu-fashionhub/blob/e5f8e1fbf5d1a6de3c412ba5ccca70f0c3e26ebb/Screenshot%202025-12-11%20123451.png)
![img alt](https://github.com/srilu396/srilu396-srilu-fashionhub/blob/e5f8e1fbf5d1a6de3c412ba5ccca70f0c3e26ebb/Screenshot%202025-12-11%20123505.png)

## 📋 Table of Contents
- [🌟 Project Overview](#-project-overview)
- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Installation](#-installation)
- [⚙️ Environment Variables](#️-environment-variables)
- [🔌 API Endpoints](#-api-endpoints)
- [🏃 Run Instructions](#-run-instructions)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)
- [📞 Support](#-support)

## 🌟 Project Overview

SriLu FashionHub is a full-featured e-commerce platform built with the MERN stack (MongoDB, Express.js, React, Node.js). The platform supports both customer-facing shopping features and an administrative dashboard for store management. The application features a modern, responsive design with animated UI elements and real-time functionality. 🚀

## ✨ Features

### 🛍️ Customer Features
- **👤 User Authentication**: Secure login/registration with JWT tokens
- **🔍 Product Browsing**: View products with filtering and search capabilities
- **🛒 Shopping Cart**: Add/remove items, update quantities
- **❤️ Wishlist**: Save favorite products for later
- **💳 Checkout Process**: Secure payment integration
- **📦 Order Management**: View order history and track orders
- **🎫 Coupon System**: Apply discount coupons during checkout
- **👤 User Profile**: Manage personal information and preferences
- **📱 Responsive Design**: Mobile-friendly interface

### 👨‍💼 Admin Features
- **📊 Admin Dashboard**: Overview of store performance
- **🛍️ Product Management**: CRUD operations for products
- **📋 Order Management**: Process and track customer orders
- **👥 Customer Management**: View and manage user accounts
- **🎫 Coupon Management**: Create and manage discount coupons
- **📈 Analytics**: Sales reports and business insights
- **⚙️ Settings**: Configure store settings and preferences
- **💬 Customer Messages**: Manage customer inquiries and support tickets

### 🔧 Technical Features
- **🔄 Redux State Management**: Centralized state for cart, user, products
- **🎯 Context API**: Additional context providers for auth and products
- **🎣 Custom Hooks**: Reusable hooks for animations and effects
- **🛡️ Middleware**: Authentication and authorization middleware
- **🔗 API Integration**: RESTful API with proper error handling
- **🔒 Environment Configuration**: Secure configuration management
- **⚡ Optimized Performance**: Lazy loading and code splitting

## 🛠️ Tech Stack

### 🔙 Backend
- **🟢 Node.js** - Runtime environment
- **🚂 Express.js** - Web framework
- **🍃 MongoDB** - Database
- **🐪 Mongoose** - ODM for MongoDB
- **🔐 JWT** - Authentication
- **🌐 CORS** - Cross-origin resource sharing
- **📝 Dotenv** - Environment variables

### 🔜 Frontend
- **⚛️ React** - UI library
- **🔄 Redux Toolkit** - State management
- **🧭 React Router** - Navigation
- **📡 Axios** - HTTP client
- **🎯 Context API** - Additional state management
- **🎨 CSS3** - Styling with modern features
- **🎣 Custom Hooks** - Reusable logic

### 🔧 Development Tools
- **📦 NPM** - Package management
- **🐙 Git** - Version control
- **📬 Postman/Insomnia** - API testing
- **💻 VS Code** - Development environment

## 📁 Project Structure

```
srilu-fashionhub/
├── 📂 backend/
│   ├── 📂 middleware/
│   │   ├── adminAuth.js     # 🔐 Admin authentication middleware                                                                        
│   │   └── auth.js          # 🔑 User authentication middleware
│   ├── 📂 models/
│   │   ├── Order.js         # 📦 Order schema
│   │   ├── Product.js       # 🛍️ Product schema
│   │   ├── User.js          # 👤 User schema
│   │   ├── Setting.js       # ⚙️ Store settings schema
│   │   ├── Message.js       # 💬 Customer messages schema
│   │   └── Coupon.js        # 🎫 Coupon schema
│   ├── 📂 routes/
│   │   ├── products.js      # 🛍️ Product-related endpoints
│   │   ├── user.js          # 👤 User authentication endpoints
│   │   ├── admin.js         # 👨‍💼 Admin-specific endpoints
│   │   ├── messages.js      # 💬 Message endpoints
│   │   ├── coupons.js       # 🎫 Coupon endpoints
│   │   └── customer.js      # 👥 Customer management endpoints
│   ├── 📄 server.js         # 🚀 Main server file
│   ├── 📄 package.json      # 📦 Backend dependencies
│   └── 📄 .env             # 🔧 Environment variables
│
├── 📂 frontend/
│   ├── 📂 public/          # 📁 Static files
│   ├── 📂 src/
│   │   ├── 📂 components/
│   │   │   ├── Header.jsx              # 🏷️ Navigation header
│   │   │   ├── ProductCard.jsx         # 🛍️ Product display component
│   │   │   ├── AnimatedBackground.jsx  # ✨ UI animations
│   │   │   ├── LoadingSpinner.jsx      # ⏳ Loading indicator
│   │   │   └── CouponModal.jsx         # 🎫 Coupon application modal
│   │   │
│   │   ├── 📂 pages/
│   │   │   ├── 📂 user/
│   │   │   │   ├── UserDashboard.jsx    # 📊 User dashboard
│   │   │   │   ├── UserLogin.jsx        # 🔐 Login page
│   │   │   │   ├── CartPage.jsx         # 🛒 Shopping cart
│   │   │   │   ├── UserCoupons.jsx      # 🎫 User's coupons
│   │   │   │   ├── UserProfile.jsx      # 👤 Profile management
│   │   │   │   ├── OrdersPage.jsx       # 📦 Order history
│   │   │   │   └── WishlistPage.jsx     # ❤️ Wishlist management
│   │   │   │
│   │   │   ├── 📂 admin/
│   │   │   │   ├── AdminLogin.jsx        # 🔐 Admin login
│   │   │   │   ├── AnalyticsPage.jsx     # 📈 Sales analytics
│   │   │   │   ├── OrdersManagement.jsx  # 📋 Manage orders
│   │   │   │   ├── SettingsPage.jsx      # ⚙️ Store settings
│   │   │   │   ├── AdminDashboard.jsx    # 📊 Admin dashboard
│   │   │   │   ├── ProductsManagement.jsx # 🛍️ Manage products
│   │   │   │   ├── NewProduct.jsx        # ➕ Add new product
│   │   │   │   ├── CustomersManagement.jsx # 👥 Manage customers
│   │   │   │   ├── CouponsManagement.jsx # 🎫 Manage coupons
│   │   │   │   └── NewCoupon.jsx         # ➕ Create new coupon
│   │   │   │
│   │   │   └── LandingPage.jsx           # 🏠 Home page
│   │   │
│   │   ├── 📂 redux/
│   │   │   ├── 📂 slices/
│   │   │   │   ├── authSlice.js        # 🔐 Authentication state
│   │   │   │   ├── cartSlice.js        # 🛒 Cart state
│   │   │   │   ├── orderSlice.js       # 📦 Order state
│   │   │   │   ├── productSlice.js     # 🛍️ Product state
│   │   │   │   └── wishlistSlice.js    # ❤️ Wishlist state
│   │   │   ├── index.js                # 📤 Redux exports
│   │   │   └── store.js                # 🏪 Redux store configuration
│   │   │
│   │   ├── 📂 context/
│   │   │   ├── AuthContext.js          # 🔐 Auth context provider
│   │   │   └── ProductContext.js       # 🛍️ Product context provider
│   │   │
│   │   ├── 📂 utils/
│   │   │   ├── api.js                  # 🔗 API configuration
│   │   │   └── constants.js            # 📝 App constants
│   │   │
│   │   ├── 📂 hooks/
│   │   │   ├── useAnimation.js         # ✨ Custom animation hook
│   │   │   └── useScrollEffect.js      # 📜 Scroll effect hook
│   │   │
│   │   ├── App.js                      # ⚛️ Main App component
│   │   ├── App.css                     # 🎨 Global styles
│   │   ├── index.js                    # 🚀 Entry point
│   │   └── index.css                   # 🎨 Base styles
│   │
│   └── 📄 package.json                 # 📦 Frontend dependencies
│
├── 📄 README.md                        # 📖 This file
└── 📄 .gitignore                       # 🙈 Git ignore rules
```

## 🚀 Installation

### 📋 Prerequisites
- 🟢 Node.js (v14 or higher)
- 🍃 MongoDB (local or Atlas)
- 📦 NPM or Yarn

### 🔙 Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=admin123
   ```

4. Start the backend server:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

### 🔜 Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory (if needed):
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## ⚙️ Environment Variables

### 🔙 Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/srilu_fashionhub
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
ADMIN_EMAIL=admin@srilufashionhub.com
ADMIN_PASSWORD=secure_admin_password
```

### 🔜 Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X
```

## 🔌 API Endpoints

### 🔐 Authentication
- `POST /api/auth/register` - 👤 User registration
- `POST /api/auth/login` - 🔑 User login
- `POST /api/auth/admin/login` - 👨‍💼 Admin login
- `GET /api/auth/me` - 👤 Get current user
- `PUT /api/auth/update` - ✏️ Update user profile

### 🛍️ Products
- `GET /api/products` - 📋 Get all products
- `GET /api/products/:id` - 🔍 Get single product
- `POST /api/products` - ➕ Create product (Admin)
- `PUT /api/products/:id` - ✏️ Update product (Admin)
- `DELETE /api/products/:id` - ❌ Delete product (Admin)

### 📦 Orders
- `POST /api/orders` - ➕ Create new order
- `GET /api/orders` - 📋 Get user orders
- `GET /api/orders/all` - 📋 Get all orders (Admin)
- `PUT /api/orders/:id` - ✏️ Update order status (Admin)

### 🛒 Cart
- `GET /api/cart` - 📋 Get user cart
- `POST /api/cart` - ➕ Add to cart
- `PUT /api/cart/:id` - ✏️ Update cart item
- `DELETE /api/cart/:id` - ❌ Remove from cart

### 🎫 Coupons
- `GET /api/coupons` - 📋 Get all coupons
- `POST /api/coupons` - ➕ Create coupon (Admin)
- `PUT /api/coupons/:id` - ✏️ Update coupon (Admin)
- `DELETE /api/coupons/:id` - ❌ Delete coupon (Admin)
- `POST /api/coupons/validate` - ✅ Validate coupon

## 🏃 Run Instructions

### 🚀 Development Mode
1. Start MongoDB service
2. Open terminal for backend:
   ```bash
   cd backend
   npm run dev
   ```
3. Open another terminal for frontend:
   ```bash
   cd frontend
   npm start
   ```
4. Open browser and navigate to `http://localhost:3000`

### 🚀 Production Build
1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```
2. Serve the build folder with backend or separate server

## 🤝 Contributing

1. 🍴 Fork the repository
2. 🌿 Create a feature branch: `git checkout -b feature-name`
3. 💾 Commit changes: `git commit -m 'Add some feature'`
4. 📤 Push to branch: `git push origin feature-name`
5. 🔄 Open a Pull Request

### 📝 Code Guidelines
- 👥 Follow existing code style and structure
- 💬 Add comments for complex logic
- 📚 Update documentation as needed
- 🧪 Test changes thoroughly


## 🙏 Acknowledgments

- ⚛️ Built with the MERN stack
- 🛍️ Inspired by modern e-commerce platforms
- 👨‍💻 Thanks to all open-source contributors

## 📞 Support

For support, email: 📧 support@srilufashionhub.com or create an issue in the repository.
secure. 🛡️
