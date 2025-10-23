# RAG Chatbot - Docker Deployment Guide

## Quick Start with Docker

### Prerequisites
- Docker Desktop installed
- Docker Compose installed
- Google Gemini API key

### Step 1: Environment Setup

1. Copy the example environment file:
```bash
copy .env.docker.example .env
```

2. Edit `.env` and add your configuration:
   - `GOOGLE_API_KEY`: Your Google Gemini API key
   - `MONGO_ROOT_PASSWORD`: Set a secure password
   - `CORS_ORIGINS`: Add your production domain

### Step 2: Build and Run

Build and start all services:
```bash
docker-compose up --build
```

Or run in detached mode (background):
```bash
docker-compose up -d --build
```

### Step 3: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **MongoDB**: localhost:27017

### Step 4: Stop the Application

```bash
docker-compose down
```

To also remove volumes (database data):
```bash
docker-compose down -v
```

## Docker Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Restart Services
```bash
# All services
docker-compose restart

# Specific service
docker-compose restart backend
```

### Check Service Status
```bash
docker-compose ps
```

### Access Container Shell
```bash
# Backend
docker-compose exec backend bash

# Frontend
docker-compose exec frontend sh

# MongoDB
docker-compose exec mongodb mongosh
```

## Production Deployment

### Using Docker Compose on Server

1. Clone repository on server
2. Set up `.env` file with production values
3. Update `CORS_ORIGINS` to include your domain
4. Run with:
```bash
docker-compose up -d
```

### Using Individual Containers

#### Backend
```bash
cd backend
docker build -t rag-chatbot-backend .
docker run -p 8000:8000 --env-file .env rag-chatbot-backend
```

#### Frontend
```bash
cd frontend
docker build -t rag-chatbot-frontend .
docker run -p 3000:3000 rag-chatbot-frontend
```

## Health Checks

All services include health checks:
- Backend: `http://localhost:8000/api/health`
- Frontend: `http://localhost:3000`
- MongoDB: `mongosh --eval "db.adminCommand('ping')"`

## Volumes

Persistent data is stored in Docker volumes:
- `mongodb_data`: MongoDB database files
- `mongodb_config`: MongoDB configuration

## Network

All services communicate through `rag-chatbot-network` bridge network.

## Troubleshooting

### MongoDB Connection Issues
```bash
docker-compose logs mongodb
docker-compose exec mongodb mongosh
```

### Backend Not Starting
```bash
docker-compose logs backend
```

### Frontend Build Errors
```bash
docker-compose logs frontend
docker-compose exec frontend npm run build
```

### Reset Everything
```bash
docker-compose down -v
docker-compose up --build
```

## Environment Variables

### Required
- `GOOGLE_API_KEY`: Google Gemini API key
- `MONGO_ROOT_PASSWORD`: MongoDB admin password

### Optional
- `ENVIRONMENT`: production/development (default: production)
- `CORS_ORIGINS`: Allowed origins (default: localhost)
- `BACKEND_API_URL`: Backend URL for frontend (default: http://backend:8000)

## Security Notes

1. Never commit `.env` file to version control
2. Use strong passwords for MongoDB
3. Keep API keys secure
4. Update CORS origins for production
5. Use HTTPS in production with reverse proxy

## Next Steps

- Set up reverse proxy (Nginx/Caddy)
- Configure SSL certificates
- Set up monitoring and logging
- Implement backup strategy
- Configure auto-restart policies
