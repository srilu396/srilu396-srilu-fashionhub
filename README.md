# 🛍️ SRILU FashionHub - Luxury E-Commerce Platform

![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue)
![Frontend Deployment](https://img.shields.io/badge/Vercel-Frontend-black?logo=vercel)
![Backend Deployment](https://img.shields.io/badge/Render-Backend-informational?logo=render)
![License](https://img.shields.io/badge/License-MIT-green)

SRILU FashionHub is an exclusive luxury fashion e-commerce application built on the MERN stack (MongoDB, Express.js, React, Node.js) with real-time WebSocket capabilities for order tracking, customer messaging, live activity monitoring, and administrative store management.

---

## 🏗️ Architecture Overview

```
                 SRILU FashionHub
                       │
             ┌─────────┴─────────┐
             │                   │
      Vercel Frontend     Render Backend
     (React SPA / CSS)    (Express + WS API)
             │                   │
             └──────── HTTPS ────┘
                       │
                 MongoDB Atlas
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Redux Toolkit, React Router v6, Lucide React, Framer Motion, Vanilla CSS
- **Backend**: Node.js, Express.js, WebSockets (`ws`), Mongoose, JWT, BcryptJS, CORS, Nodemailer
- **Database**: MongoDB Atlas (Cloud NoSQL)
- **Deployment**: Vercel (Frontend), Render (Backend Web Service)

---

## 📁 Project Structure

```
srilu-fashionhub/
├── frontend/                  # React Single Page Application (Vercel)
│   ├── public/                # Favicon, manifest.json, index.html
│   ├── src/
│   │   ├── components/        # UI Components (Admin & User)
│   │   ├── context/           # AuthContext, ProductContext, ToastContext
│   │   ├── pages/             # Route Pages (Admin & User)
│   │   ├── redux/             # Redux Store & Slices
│   │   └── utils/             # API client, constants
│   ├── vercel.json            # Vercel SPA route rewrite rules
│   └── package.json
├── backend/                   # Express & WebSocket Server (Render)
│   ├── middleware/            # Auth & Admin authentication
│   ├── models/                # Mongoose Models
│   ├── routes/                # Express API Routes
│   ├── scripts/               # Utility scripts
│   ├── server.js              # Express app & WebSocket server
│   └── package.json
├── README.md                  # Project Documentation
└── .gitignore                 # Environment & build exclusions
```

---

## 💻 Local Development Setup

### 1. Prerequisites
- Node.js (v16+ recommended)
- MongoDB Atlas account or local MongoDB instance (`mongodb://127.0.0.1:27017`)

### 2. Clone & Install Dependencies

```bash
# Clone repository
git clone https://github.com/srilu396/srilu-fashionhub.git
cd srilu-fashionhub

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Configure Local Environment Variables

Create `.env` inside `backend/`:
```env
PORT=5001
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/srilu_fashion_hub_db?retryWrites=true&w=majority
JWT_SECRET=your_development_jwt_secret_key
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@srilufashionhub.com
ADMIN_PASSWORD=SriluF@sh1on@2024!
CLIENT_URL=http://localhost:3000
```

Create `.env` inside `frontend/`:
```env
REACT_APP_API_URL=http://localhost:5001
```

### 4. Run Locally

Start Backend:
```bash
cd backend
npm start
```

Start Frontend (in a separate terminal):
```bash
cd frontend
npm start
```

---

## 🚀 Production Deployment Guide

### Deployment Order:
1. **Database Setup** (MongoDB Atlas)
2. **Backend Deployment** (Render Web Service)
3. **Frontend Deployment** (Vercel Static Site)

---

### Step 1: MongoDB Atlas Database Setup
1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Database User with read/write privileges.
3. Network Access: Allow access from anywhere (`0.0.0.0/0`) to allow Render IPs to connect.
4. Copy your connection string: `mongodb+srv://<user>:<password>@cluster.mongodb.net/srilu_fashion_hub_db?retryWrites=true&w=majority`.

---

### Step 2: Deploy Backend to Render

1. Log into [Render Dashboard](https://dashboard.render.com/) and create a **New Web Service**.
2. Connect your GitHub repository.
3. Configure settings:
   - **Name**: `srilu-fashionhub-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add Environment Variables on Render:
   - `PORT`: `5000` (or leave default; Render automatically sets `PORT`)
   - `MONGODB_URI`: `<your-mongodb-atlas-connection-string>`
   - `JWT_SECRET`: `<your-secure-production-jwt-secret>`
   - `JWT_EXPIRES_IN`: `7d`
   - `ADMIN_EMAIL`: `admin@srilufashionhub.com`
   - `ADMIN_PASSWORD`: `<your-secure-admin-password>`
   - `CLIENT_URL`: `https://<your-app-name>.vercel.app`
5. Click **Create Web Service**. Note your backend URL (e.g. `https://srilu-fashionhub-backend.onrender.com`).

---

### Step 3: Deploy Frontend to Vercel

1. Log into [Vercel Dashboard](https://vercel.com/) and click **Add New Project**.
2. Import the `srilu-fashionhub` repository.
3. Configure project settings:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
4. Environment Variables:
   - `REACT_APP_API_URL`: `https://srilu-fashionhub-backend.onrender.com` (your Render backend URL)
5. Click **Deploy**.

---

## 🔒 Security Best Practices

- **Never commit `.env` files**: All `.env` and `.env.local` files are ignored in `.gitignore`.
- **Credential Security**: Passwords are hashed using `bcryptjs` with salt rounds.
- **JWT Authorization**: Admin and User API routes require valid Bearer token authentication headers.

---

## ❓ Troubleshooting & FAQs

### 1. 404 Error when refreshing routes (e.g. `/admin/dashboard`) on Vercel
- **Cause**: Client-side single page app routing relies on HTML5 history.
- **Fix**: Verify `frontend/vercel.json` contains SPA rewrite rules pointing all unknown routes to `/index.html`.

### 2. CORS Error when calling API from Vercel to Render
- **Cause**: Backend CORS origin blocking requests.
- **Fix**: Set `CLIENT_URL` in Render environment variables to match your exact Vercel deployment URL (e.g., `https://your-app.vercel.app`).

### 3. Backend Deployment Sleep Delay on Free Render Tier
- **Cause**: Render free tier Web Services spin down after 15 minutes of inactivity.
- **Fix**: Initial request might take 30-50 seconds to wake up. Consider a ping service or paid Render instance for instant responses.

### 4. MongoDB Connection Failure
- **Cause**: IP Whitelist restriction on MongoDB Atlas or invalid database connection credentials.
- **Fix**: Add `0.0.0.0/0` in MongoDB Atlas Network Access tab and check database user credentials.

---

## 📄 License
This project is licensed under the MIT License.
