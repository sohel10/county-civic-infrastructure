# County Health Comparison Tool 🏥

Compare poverty rates vs health outcomes across 3,135 US counties.

**Live Demo:** https://county.energyforecastai.org/

---

## 📊 Project Overview

This tool analyzes the correlation between poverty and health outcomes using real data from:
- **US Census Bureau (2023):** Poverty rates for all 3,135 US counties
- **CDC PLACES (2023):** 14 health metrics (diabetes, obesity, heart disease, stroke, etc.)

**Key Features:**
- Search 3,135 US counties by name or state
- Compare up to 5 counties simultaneously
- Visualize poverty % vs health outcomes with interactive charts
- Export data to CSV
- AI-powered health equity insights (with OpenAI API key)

---

## 💾 Data Included

**Health Metrics (from CDC PLACES):**
- Diabetes prevalence
- Obesity prevalence
- High blood pressure
- Coronary heart disease
- Stroke
- COPD
- Asthma
- Depression
- Kidney disease
- Cancer
- Disability percentage
- General health status
- Mental health status
- Sleep quality

**Socioeconomic Data (from US Census):**
- Poverty percentage
- Median income

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React.js with Chart.js |
| Backend | Python Flask |
| Database | SQLite (3,135 counties × 14 metrics) |
| Server | AWS EC2 (Ubuntu 24.04) |
| Containerization | Docker |
| Web Server | Nginx reverse proxy |
| SSL/TLS | Let's Encrypt (HTTPS) |

---

## 📋 Prerequisites

### For Local Development:
- **Node.js** 16+ and npm
- **Python** 3.8+
- **Git**
- **Docker** (optional, for testing container locally)

### For AWS Deployment:
- **AWS EC2 instance** (t2.small minimum)
- **Elastic IP** (for static IP address)
- **Domain name** (for SSL certificate)
- **SSH key pair** (.pem file)

---

## 🚀 Setup & Installation

### Part 1: LOCAL DEVELOPMENT

#### 1.1 Clone Repository
```bash
cd ~
git clone <repository-url> county_comparison
cd county_comparison
```

#### 1.2 Setup Frontend (React)

**Install dependencies:**
```bash
cd ~/county_comparison/frontend-react
npm install
```

**Create .env file for local development:**
```bash
# .env.development (or just .env for local testing)
REACT_APP_API_URL=http://localhost:5001/api
PORT=4000
```

**Start development server:**
```bash
npm start
```

This opens http://localhost:4000 in your browser.

**What happens locally:**
- React app runs on port 4000
- Makes API calls to `http://localhost:5001/api`
- Uses Flask backend running on port 5001

#### 1.3 Setup Backend (Python Flask)

**Create Python virtual environment:**
```bash
cd ~/county_comparison/backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

**Install Python dependencies:**
```bash
pip install -r requirements.txt
```

**Create .env file for backend:**
```bash
# .env file in ~/county_comparison/backend/
OPENAI_API_KEY=your_key_here  # Optional, for AI insights feature
FLASK_ENV=development
```

**Run Flask backend:**
```bash
python3 app.py
```

Output should show:
```
 * Running on http://127.0.0.1:5001
 * Debugger is active!
```

**Test backend API:**
```bash
# In another terminal
curl http://localhost:5001/api/states
```

Should return JSON with all 50 states.

#### 1.4 Verify Local Setup Works

1. **Frontend running:** http://localhost:4000
2. **Backend running:** http://localhost:5001
3. **Backend responds to API:** `curl http://localhost:5001/api/states`
4. **Frontend can reach backend:** State dropdown populates with 50 states
5. **No errors in browser console:** Press F12, check Console tab

---

## 🏗️ Production Deployment (AWS)

### Part 2: PREPARE FOR AWS DEPLOYMENT

#### 2.1 Update API URL for Production

**CRITICAL STEP:** Change API URL from hardcoded localhost to relative path.

**In ~/county_comparison/frontend-react/src/App.js:**

```javascript
// ❌ WRONG (for local only)
const API_URL = 'http://localhost:5001/api';

// ✅ CORRECT (for production)
const API_URL = '/api';
```

**Why use relative path?** It works everywhere:
- Locally: `/api` → `http://localhost:3000/api`
- AWS IP: `/api` → `http://00.00.000.000/api`
- Domain: `/api` → `https://county.energyforecastai.org/api`

**Better approach - use environment variable:**

Create `.env.production`:
```
REACT_APP_API_URL=/api
```

In App.js:
```javascript
const API_URL = process.env.REACT_APP_API_URL || '/api';
```

#### 2.2 Build React for Production

```bash
cd ~/county_comparison/frontend-react

# Build optimized production bundle
npm run build

# Output will be in ~/county_comparison/frontend-react/build/
```

Verify build completed:
```bash
ls -la build/
# Should show: index.html, static/, manifest.json, favicon.ico
```

#### 2.3 Prepare Docker

**Create Dockerfile** in `~/county-civic-data/`:

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y sqlite3 curl && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy application files
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Expose ports
EXPOSE 5005 8000

# Create startup script
RUN echo '#!/bin/bash\ncd /app/backend && python app.py &\ncd /app/frontend && python -m http.server 8000\n' > /app/start.sh && chmod +x /app/start.sh

# Start services
CMD ["/app/start.sh"]
```

**Create requirements.txt** in `~/county-civic-data/backend/`:

```
flask==2.3.0
flask-cors==4.0.0
pandas==2.0.0
requests==2.31.0
python-dotenv==1.0.0
scipy
openai>=1.0.0
```

**Directory structure:**
```
county-civic-data/
├── Dockerfile
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── counties.db (3,135 counties)
│   └── .env (with OPENAI_API_KEY)
├── frontend/
│   ├── index.html
│   ├── static/
│   │   ├── js/
│   │   │   └── main.*.js
│   │   └── css/
│   │       └── main.*.css
│   └── manifest.json
```

### Part 3: DEPLOY TO AWS

#### 3.1 Copy React Build to AWS

**From local machine:**
```bash
cd ~/county_comparison/frontend-react


#### 3.2 Connect to AWS Server

```bash
ssh -i ~/path/to/key.pem ubuntu@00.00.000.00
```

#### 3.3 Install Required Software on AWS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io
sudo usermod -aG docker ubuntu
sudo systemctl start docker
sudo systemctl enable docker

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Create web server directory
sudo mkdir -p /var/www/html/county
sudo chown -R ubuntu:ubuntu /var/www/html/county
```

#### 3.4 Build and Run Docker Container

```bash
cd ~/county-civic-data

# Build Docker image (--no-cache forces fresh build)
docker build --no-cache -t county-civic-data:latest .

# Run Docker container
docker run -d \
  --name county-civic-app \
  -p 5006:5005 \
  -p 8001:8000 \
  --env-file ~/county-civic-data/backend/.env \
  county-civic-data:latest

# Wait for startup
sleep 5

# Verify container is running
docker ps

# Check logs
docker logs county-civic-app
```

#### 3.5 Configure Nginx Reverse Proxy

**Create Nginx config:**
```bash
sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOF'
server {
    listen 80;
    listen 443 ssl http2;
    server_name _;

    ssl_certificate /etc/letsencrypt/live/county.energyforecastai.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/county.energyforecastai.org/privkey.pem;

    location / {
        proxy_pass http://00.000.000.0000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://00.000.0000.0000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

**Test and reload Nginx:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

#### 3.6 Setup SSL Certificate

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot certonly --nginx -d county.energyforecastai.org

# Enable auto-renewal
sudo systemctl enable certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

---

## ✅ Testing & Verification

### Local Development Tests

```bash
# Terminal 1: Start backend
cd ~/county_comparison/backend
python3 app.py

# Terminal 2: Start frontend
cd ~/county_comparison/frontend-react
npm start

# Terminal 3: Test API
curl http://localhost:5001/api/states
curl http://localhost:5001/api/counties/by-state?state=Alabama
curl http://localhost:5001/api/search?q=Wayne
```

### Production Deployment Tests

**Backend API:**
```bash
curl http://35.153.118.189/api/states
curl http://35.153.118.189/api/counties/by-state?state=Alabama
```

**Frontend:**
- Visit: https://county.energyforecastai.org/
- Verify landing page displays:
  - ✓ 3,135 US Counties counter
  - ✓ 50 States counter
  - ✓ 2023 Data Year
  - ✓ LAUNCH DASHBOARD button

**Click "LAUNCH DASHBOARD" and verify:**
- ✓ State dropdown populated (50 states)
- ✓ Statistics cards show poverty%, diabetes%, obesity%
- ✓ County table displays data
- ✓ Search function works
- ✓ Multi-county comparison works

**Browser Console Check (F12):**
- ✓ NO CORS errors
- ✓ NO "Cannot connect" errors
- ✓ NO 404 errors
- ✓ All API calls return HTTP 200

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to Flask API on port 5001"

**Cause:** App.js still has hardcoded localhost URL

**Solution:**
```javascript
// Change from:
const API_URL = 'http://localhost:5001/api';

// To:
const API_URL = '/api';

// Then rebuild and redeploy
npm run build
```

### Issue: CORS errors in browser console

**Cause:** Nginx proxy not routing /api/ correctly

**Solution:**
```bash
# Verify Nginx config has location /api/ block
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check backend is running on port 5006
netstat -tlnp | grep 5006
```

### Issue: 404 errors on static files (CSS, JS)

**Cause:** Files not copied to both locations

**Solution:**
```bash
# Copy to both web server and Docker directories
scp -r build/* ubuntu@000.000.0000:/var/www/html/county/
scp -r build/* ubuntu@000.000.0000:~/county-civic-data/frontend/

# Rebuild Docker with --no-cache
docker build --no-cache -t county-civic-data:latest .
docker restart county-civic-app
```

### Issue: Docker container not starting

**Cause:** Port already in use or bad config

**Solution:**
```bash
# Stop and remove old container
docker stop county-civic-app
docker rm county-civic-app

# Check ports are free
netstat -tlnp | grep 5006
netstat -tlnp | grep 8001

# Rebuild and run
docker build --no-cache -t county-civic-data:latest .
docker run -d --name county-civic-app -p 5006:5005 -p 8001:8000 --env-file .env county-civic-data:latest

# Check logs
docker logs county-civic-app
```

---

## 📁 Project Structure

```
county_comparison/
├── frontend-react/
│   ├── src/
│   │   ├── App.js (main component - UPDATE API_URL HERE)
│   │   ├── App.css
│   │   └── index.js
│   ├── public/
│   ├── build/ (generated by npm run build)
│   ├── package.json
│   └── .env (local development only)
│
├── backend/
│   ├── app.py (Flask API)
│   ├── requirements.txt
│   ├── counties.db (SQLite - 3,135 counties)
│   ├── .env (OPENAI_API_KEY, etc.)
│   └── preprocess_with_poverty.py
│
└── county-civic-data/ (Docker project)
    ├── Dockerfile
    ├── backend/
    ├── frontend/ (React build files)
    └── README.md
```

---

## 🔑 Environment Variables

### Frontend (.env for local development)
```
REACT_APP_API_URL=http://localhost:5001/api
PORT=4000
```

### Frontend (.env.production for AWS)
```
REACT_APP_API_URL=/api
```

### Backend (.env)
```
OPENAI_API_KEY=sk-... (optional, for AI insights)
FLASK_ENV=production
```

---

## 📊 API Endpoints

All endpoints return JSON format.

### Get All States
```bash
GET /api/states
```

Response:
```json
{
  "count": 50,
  "data": [
    {"state": "Alabama", "county_count": 67},
    {"state": "Alaska", "county_count": 30}
  ]
}
```

### Get Counties by State
```bash
GET /api/counties/by-state?state=Alabama
```

Response:
```json
[
  {
    "fips": 1001,
    "county_name": "Autauga County",
    "state_name": "Alabama",
    "poverty_pct": 14.2,
    "diabetes_adjprev": 11.5,
    "obesity_adjprev": 37.2
  }
]
```

### Search Counties
```bash
GET /api/search?q=Wayne
```

### Compare Multiple Counties
```bash
POST /api/compare
Body: {"counties": [{"fips": 26163, "state": "Michigan"}, ...]}
```

---

## 🚀 Deployment Checklist

- [ ] API_URL changed from localhost to /api in App.js
- [ ] npm run build completed successfully
- [ ] Build files copied to /var/www/html/county/
- [ ] Build files copied to ~/county-civic-data/frontend/
- [ ] Docker image built with --no-cache
- [ ] Docker container running (docker ps shows county-civic-app)
- [ ] Backend API responding (curl http://000.000.0000/api/states)
- [ ] Nginx config tested (sudo nginx -t)
- [ ] SSL certificate obtained (sudo certbot certonly)
- [ ] Browser loads https://county.energyforecastai.org/
- [ ] State dropdown populates
- [ ] Browser console has zero red errors (F12)
- [ ] County search works
- [ ] Multi-county comparison works

---

## 📝 Important Notes

### For Local Development
- Use `const API_URL = 'http://localhost:5001/api'`
- Frontend runs on port 4000
- Backend runs on port 5001
- Files are NOT dockerized

### For AWS Production
- Use `const API_URL = '/api'` (relative path)
- Everything runs in Docker containers
- Nginx proxies traffic to containers
- Domain uses HTTPS with SSL certificate

### Never Do This
- ❌ Use hardcoded localhost in production code
- ❌ Modify minified JavaScript files directly
- ❌ Keep old files in multiple locations
- ❌ Deploy without updating API URL
- ❌ Skip testing after deployment

### Always Do This
- ✓ Change API URL to /api before building for production
- ✓ Run npm run build before deploying
- ✓ Copy files to both web server and Docker directories
- ✓ Rebuild Docker with --no-cache
- ✓ Test in browser console (F12) for errors
- ✓ Verify API responds before calling it a success

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push branch: `git push origin feature/your-feature`
4. Submit pull request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 📧 Contact & Support

**Project Owner:** Ariana Tabassum Rabita
**Deployment Status:** ✓ Production Ready (Sept 15, 2026)
**Live URL:** https://county.energyforecastai.org/

For issues or questions, contact the development team.

---

## 🔗 Useful Links

- **Census Data:** https://www.census.gov/topics/income-poverty/poverty.html
- **CDC PLACES:** https://chronicdata.cdc.gov/browse?category=PLACES
- **React Documentation:** https://react.dev
- **Flask Documentation:** https://flask.palletsprojects.com
- **Docker Documentation:** https://docs.docker.com
- **Nginx Documentation:** https://nginx.org/en/docs/
- **Let's Encrypt:** https://letsencrypt.org

---

**Last Updated:** September 15, 2026  
**Status:** ✓ PRODUCTION READY