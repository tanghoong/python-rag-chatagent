# Production Deployment Guide

This guide covers deploying the RAG Chatbot to various cloud platforms.

## Prerequisites

- [ ] Google Gemini API key
- [ ] MongoDB Atlas account (or self-hosted MongoDB)
- [ ] Cloud platform account (Vercel/Railway/AWS/GCP/Azure)
- [ ] Domain name (optional)

---

## Option 1: Deploy to Vercel + MongoDB Atlas (Recommended)

### Step 1: Set up MongoDB Atlas

1. Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (Free tier available)
3. Create database user with password
4. Whitelist IP addresses (0.0.0.0/0 for development)
5. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/rag-chatbot?retryWrites=true&w=majority
   ```

### Step 2: Deploy Backend to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Create `vercel.json` in backend directory:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "api/main.py",
         "use": "@vercel/python"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "api/main.py"
       }
     ]
   }
   ```

3. Deploy:
   ```bash
   cd backend
   vercel --prod
   ```

4. Set environment variables in Vercel dashboard:
   - `MONGODB_URI`
   - `GOOGLE_API_KEY`
   - `CORS_ORIGINS`

### Step 3: Deploy Frontend to Vercel

1. Update frontend `.env.production`:
   ```
   VITE_API_URL=https://your-backend.vercel.app
   ```

2. Deploy:
   ```bash
   cd frontend
   vercel --prod
   ```

---

## Option 2: Deploy to Railway

### Backend Deployment

1. Create account at [railway.app](https://railway.app)
2. Create new project
3. Connect GitHub repository
4. Add MongoDB plugin
5. Set environment variables:
   - `GOOGLE_API_KEY`
   - `MONGODB_URI` (auto-set by Railway)
   - `CORS_ORIGINS`
6. Deploy will happen automatically

### Frontend Deployment

1. Create new service in same project
2. Connect GitHub repository (frontend folder)
3. Set build command: `npm run build`
4. Set start command: `npm run start`
5. Add environment variable:
   - `VITE_API_URL=https://your-backend.railway.app`

---

## Option 3: Deploy with Docker (VPS/Cloud VM)

### Step 1: Server Setup

1. Provision a VPS (DigitalOcean, Linode, AWS EC2, etc.)
2. Install Docker and Docker Compose:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo apt install docker-compose
   ```

### Step 2: Deploy Application

1. Clone repository on server:
   ```bash
   git clone https://github.com/yourusername/python-rag-chatagent.git
   cd python-rag-chatagent
   ```

2. Create `.env` file:
   ```bash
   cp .env.docker.example .env
   nano .env  # Edit with your values
   ```

3. Build and run:
   ```bash
   docker-compose up -d --build
   ```

4. Check logs:
   ```bash
   docker-compose logs -f
   ```

### Step 3: Configure Nginx Reverse Proxy

1. Install Nginx:
   ```bash
   sudo apt install nginx
   ```

2. Create Nginx config `/etc/nginx/sites-available/rag-chatbot`:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       # Frontend
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
       
       # Backend API
       location /api {
           proxy_pass http://localhost:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. Enable site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/rag-chatbot /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Step 4: SSL with Let's Encrypt

1. Install Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. Get SSL certificate:
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. Auto-renewal is configured automatically

---

## Option 4: Deploy to AWS

### Backend (Elastic Beanstalk)

1. Install AWS CLI and EB CLI
2. Initialize:
   ```bash
   cd backend
   eb init -p python-3.11 rag-chatbot-backend
   ```

3. Create environment:
   ```bash
   eb create rag-chatbot-prod
   ```

4. Set environment variables:
   ```bash
   eb setenv GOOGLE_API_KEY=xxx MONGODB_URI=xxx
   ```

### Frontend (S3 + CloudFront)

1. Build frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Create S3 bucket for static hosting
3. Upload build files to S3
4. Create CloudFront distribution pointing to S3
5. Configure custom domain

---

## Option 5: Deploy to Google Cloud Platform

### Backend (Cloud Run)

1. Build container:
   ```bash
   cd backend
   gcloud builds submit --tag gcr.io/PROJECT_ID/rag-chatbot-backend
   ```

2. Deploy:
   ```bash
   gcloud run deploy rag-chatbot-backend \
     --image gcr.io/PROJECT_ID/rag-chatbot-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

3. Set environment variables in Cloud Run console

### Frontend (Cloud Run or Firebase Hosting)

Similar process for frontend or use Firebase Hosting for static sites.

---

## Post-Deployment Checklist

### Security
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set secure environment variables
- [ ] Enable firewall rules
- [ ] Set up rate limiting
- [ ] Configure CSP headers

### Monitoring
- [ ] Set up application monitoring (Sentry, DataDog)
- [ ] Configure log aggregation
- [ ] Set up uptime monitoring
- [ ] Configure alerts for errors
- [ ] Monitor API usage and costs

### Performance
- [ ] Enable CDN for static assets
- [ ] Configure caching headers
- [ ] Enable gzip/brotli compression
- [ ] Optimize images
- [ ] Test with Lighthouse

### Backup
- [ ] Configure MongoDB automated backups
- [ ] Set up backup schedule
- [ ] Test restore procedure
- [ ] Document backup locations

### Documentation
- [ ] Update README with production URLs
- [ ] Document environment variables
- [ ] Create runbook for common issues
- [ ] Document scaling procedures

---

## Environment Variables Summary

### Backend
```bash
MONGODB_URI=mongodb+srv://...
GOOGLE_API_KEY=AIza...
ENVIRONMENT=production
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Frontend
```bash
VITE_API_URL=https://api.yourdomain.com
VITE_ENV=production
```

---

## Troubleshooting

### Common Issues

**CORS Errors**
- Update `CORS_ORIGINS` in backend
- Verify frontend is using correct API URL

**Database Connection Failed**
- Check MongoDB Atlas IP whitelist
- Verify connection string format
- Check network firewall rules

**Build Failures**
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify all environment variables are set

**High Latency**
- Deploy backend close to database region
- Enable CDN for frontend
- Optimize MongoDB queries
- Consider adding Redis cache

---

## Scaling Considerations

### Horizontal Scaling
- Load balancer for multiple backend instances
- Session management (if needed)
- Distributed caching

### Vertical Scaling
- Increase container resources
- Upgrade database tier
- Optimize queries

### Cost Optimization
- Use spot instances for non-critical workloads
- Implement request caching
- Monitor API usage
- Use reserved instances for steady-state load

---

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review API health: `https://your-api.com/api/health`
- Check database connectivity
- Review documentation

---

**Last Updated**: October 24, 2025
