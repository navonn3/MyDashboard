# Deployment Guide

This guide covers deploying the Application Management Dashboard to various hosting platforms.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Option 1: Vercel (Recommended for Frontend)](#option-1-vercel)
- [Option 2: Railway (Full Stack)](#option-2-railway)
- [Option 3: Render (Full Stack)](#option-3-render)
- [Option 4: DigitalOcean App Platform](#option-4-digitalocean)
- [Option 5: VPS/Self-hosted](#option-5-vps)
- [Environment Variables](#environment-variables)

---

## Prerequisites

Before deploying, ensure you have:
- A GitHub account with this repository pushed
- Node.js 18+ for local testing
- An Anthropic API key (for AI prompt generation feature)

---

## Option 1: Vercel (Recommended for Frontend)

Best for: Frontend deployment with serverless functions or separate backend.

### Deploy Frontend to Vercel

1. **Push to GitHub** (if not already done)
   ```bash
   git push origin main
   ```

2. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub

3. **Import Project**
   - Click "Add New" > "Project"
   - Select your repository
   - Set the Root Directory to `app-dashboard/client`
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Configure Environment Variables** (if using separate backend)
   - Add `VITE_API_URL` = your backend URL (e.g., `https://your-api.railway.app`)

5. **Deploy**

### Note: Backend Needs Separate Hosting
Vercel is primarily for frontend. Deploy the backend to Railway, Render, or a VPS.

---

## Option 2: Railway (Full Stack) - Recommended

Best for: Easy full-stack deployment with databases.

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### Step 2: Deploy Backend
1. Click "New Project" > "Deploy from GitHub repo"
2. Select your repository
3. Configure the service:
   - Root Directory: `app-dashboard/server`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Add environment variable:
   - `PORT` = `3001`

### Step 3: Deploy Frontend
1. In the same project, click "New" > "GitHub Repo"
2. Select the same repository
3. Configure the service:
   - Root Directory: `app-dashboard/client`
   - Build Command: `npm install && npm run build`
   - Start Command: (empty - static files)
   - Output Directory: `dist`
4. Add environment variable:
   - `VITE_API_URL` = (copy the backend URL from Step 2)

### Step 4: Update Frontend API URL
In `app-dashboard/client/src/services/api.ts`, update:
```typescript
const API_BASE = import.meta.env.VITE_API_URL || '/api';
```

---

## Option 3: Render (Full Stack)

### Deploy Backend
1. Go to [render.com](https://render.com) and sign in
2. Click "New" > "Web Service"
3. Connect your GitHub repo
4. Configure:
   - Name: `app-dashboard-api`
   - Root Directory: `app-dashboard/server`
   - Runtime: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Instance Type: Free (or higher)

### Deploy Frontend
1. Click "New" > "Static Site"
2. Connect the same repo
3. Configure:
   - Name: `app-dashboard-web`
   - Root Directory: `app-dashboard/client`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
4. Add environment variable:
   - `VITE_API_URL` = your backend URL

---

## Option 4: DigitalOcean App Platform

### Create App
1. Go to [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Navigate to "Apps" > "Create App"
3. Select GitHub as source

### Configure Components

**Backend Component:**
- Source Directory: `app-dashboard/server`
- Type: Web Service
- Build Command: `npm install && npm run build`
- Run Command: `npm start`
- HTTP Port: 3001

**Frontend Component:**
- Source Directory: `app-dashboard/client`
- Type: Static Site
- Build Command: `npm install && npm run build`
- Output Directory: `dist`

### Environment Variables
Add to backend:
- `PORT` = `3001`
Add to frontend:
- `VITE_API_URL` = `${APP_URL}` (use backend component URL)

---

## Option 5: VPS/Self-hosted

### Requirements
- Ubuntu 20.04+ or similar Linux server
- Node.js 18+
- Nginx (for reverse proxy)
- PM2 (for process management)

### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### Step 2: Clone and Build
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO/app-dashboard

# Build server
cd server
npm install
npm run build
npm run db:seed  # Initialize database

# Build client
cd ../client
npm install
npm run build
```

### Step 3: Configure PM2
Create `ecosystem.config.js` in `app-dashboard/server`:
```javascript
module.exports = {
  apps: [{
    name: 'app-dashboard-api',
    script: 'dist/index.js',
    instances: 1,
    env: {
      PORT: 3001,
      NODE_ENV: 'production'
    }
  }]
};
```

Start the server:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 4: Configure Nginx
Create `/etc/nginx/sites-available/app-dashboard`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/app-dashboard/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/app-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Environment Variables

### Backend (Server)
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 3001 |
| `NODE_ENV` | Environment | No | development |

### Frontend (Client)
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API URL | No | /api |

### Notes
- The Anthropic API key is stored in the SQLite database via the Settings page
- For production, consider using PostgreSQL instead of SQLite
- Enable CORS properly if frontend and backend are on different domains

---

## Post-Deployment

1. **Initialize Database**
   ```bash
   npm run db:seed
   ```

2. **Configure API Key**
   - Open the deployed app
   - Go to Settings
   - Enter your Anthropic API key

3. **Test All Features**
   - Create an application
   - Add notes and ideas
   - Generate a prompt
   - Export data

---

## Troubleshooting

### CORS Issues
If you see CORS errors, update `server/src/index.ts`:
```typescript
app.use(cors({
  origin: ['https://your-frontend-domain.com'],
  credentials: true
}));
```

### Database Persistence
SQLite creates a file-based database. On platforms like Railway/Render, use:
- Railway: Attach a volume to `/app/server`
- Render: Use a Disk resource
- Or migrate to PostgreSQL for production

### Build Failures
Ensure all dependencies are in `dependencies` (not `devDependencies`) for production builds.
