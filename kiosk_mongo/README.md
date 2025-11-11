# Kiosk Starter (React + Express + MongoDB Atlas)

## Overview
Simple kiosk demo app using React frontend and Express backend with MongoDB Atlas.
- Supports user & kiosk registration and login.
- Passwords stored in plaintext for simplicity (do **not** use in production).

## Setup Instructions

### 1️⃣ MongoDB Atlas Setup
1. Create free cluster at https://cloud.mongodb.com
2. Create database user (username/password)
3. Get connection string like:
   `mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/kiosk_app`
4. Replace it in backend `.env` as `MONGO_URI`

### 2️⃣ Backend
```bash
cd backend
cp .env.example .env
npm install
npm start
```

### 3️⃣ Frontend
```bash
cd frontend
npm install
npm start
```

Backend runs on port 4000, frontend on 3000.

####these commands run with kiosk folder path

git add .
git commit -m "Updated feature xyz"
git push