# Docker Setup for KalaMitra MVP

This guide explains how to run the KalaMitra application using Docker containers.

## Prerequisites

- Docker and Docker Compose installed on your system
- Environment variables configured (see below)

## Environment Variables

Before running the application, you need to set up your environment variables:

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file with your actual values:
   - `NEXT_PUBLIC_API_BASE_URL`: The URL where your backend API will be accessible
   - `MONGO_URI`: MongoDB connection string
   - `FIREBASE_SERVICE_ACCOUNT_PATH`: Path to your Firebase service account JSON file
   - `GOOGLE_API_KEY`: Your Google Gemini AI API key

## Running the Application

### Production Mode

To run the application in production mode:

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Development Mode

To run the application in development mode with hot reloading:

```bash
# Build and start development services
docker-compose -f docker-compose.dev.yml up --build

# Or run in detached mode
docker-compose -f docker-compose.dev.yml up --build -d
```

## Services

The application consists of three main services:

### Frontend (Port 3000)
- Next.js application
- Available at: http://localhost:3000
- Health check: http://localhost:3000/api/health

### Backend (Port 8000)
- FastAPI application
- Available at: http://localhost:8000
- API documentation: http://localhost:8000/docs
- Health check: http://localhost:8000/

### MongoDB (Port 27017)
- MongoDB database
- Database name: `kalamitra`
- Connection string: `mongodb://localhost:27017/kalamitra`

## Useful Commands

```bash
# View running containers
docker-compose ps

# View logs for specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb

# Restart a specific service
docker-compose restart backend

# Rebuild and restart a specific service
docker-compose up --build backend

# Execute commands in running containers
docker-compose exec backend python scripts/seed_orders.py
docker-compose exec mongodb mongosh kalamitra

# Clean up (remove containers, networks, and volumes)
docker-compose down -v --remove-orphans
```

## Environment-Specific Configuration

### Local Development
```bash
export NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
export MONGO_URI=mongodb://localhost:27017/kalamitra
```

### Production/Cloud Deployment
```bash
export NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
export MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/kalamitra
```

## Troubleshooting

### Images Not Displaying
- Ensure `NEXT_PUBLIC_API_BASE_URL` is correctly set in your environment
- Check that the backend service is accessible from the frontend
- Verify image URLs in the browser network tab

### Database Connection Issues
- Ensure MongoDB service is running: `docker-compose ps`
- Check MongoDB logs: `docker-compose logs mongodb`
- Verify `MONGO_URI` environment variable

### Build Failures
- Clear Docker cache: `docker system prune -f`
- Rebuild without cache: `docker-compose build --no-cache`

### Port Conflicts
If you have services running on the default ports, you can change them:
```bash
export FRONTEND_PORT=3001
export BACKEND_PORT=8001
export MONGO_PORT=27018
```

Then run: `docker-compose up`
