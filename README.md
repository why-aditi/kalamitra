# Kalamitra - Artisan Marketplace Platform

Kalamitra is a full-stack marketplace platform connecting artisans with buyers, built with Next.js 14 and FastAPI.

## Project Overview

The project consists of two main components:

- **Frontend**: Next.js 14 application with TypeScript and Tailwind CSS
- **Backend**: FastAPI service with MongoDB and Firebase Authentication

## System Requirements

### Frontend

- Node.js 18.x or higher
- npm 8.x or higher

### Backend

- Python 3.8 or higher
- MongoDB 6.0 or higher
- Firebase project with Authentication enabled

## Quick Start

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd kalamitra-mvp
```

2. Set up environment variables:
```bash
# Frontend
cp frontend/env.example frontend/.env
# Backend
cp backend/.env.example backend/.env
```

3. Build and run with Docker Compose:
```bash
docker-compose up --build
```

The services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- MongoDB: localhost:27017

### Manual Setup

1. Set up the backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Unix/macOS
pip install -r req.txt
cp .env.example .env
# Update .env with your configuration
uvicorn main:app --reload
```

2. Set up the frontend:

```bash
cd frontend
pnpm install
cp env.example .env
# Update .env with your configuration
pnpm run dev
```

## Project Structure

```
├── backend/              # Backend API service
│   ├── controllers/      # Business logic
│   ├── models/          # Data models
│   ├── routes/          # API endpoints
│   ├── services/        # External services
│   └── main.py         # Entry point
└── frontend/            # Frontend application
    ├── app/            # Next.js app router
    ├── components/     # React components
    ├── hooks/          # Custom hooks
    ├── lib/            # Utilities
    └── public/         # Static assets
```

## Key Features

- Next.js 14 App Router for frontend routing
- FastAPI for backend API
- TypeScript for type safety
- Tailwind CSS for styling
- Firebase Authentication
- MongoDB database
- Cloudinary for image storage
- Responsive design
- Docker containerization for easy deployment

## Development Guidelines

### Frontend

- Use TypeScript for all new files
- Follow component structure in `components/ui`
- Implement responsive design using Tailwind
- Use React hooks for state management
- Optimize images using Next.js Image component

### Backend

- Follow PEP 8 style guide
- Use type hints and docstrings
- Implement proper error handling
- Follow RESTful API conventions
- Secure routes with Firebase Authentication

## API Documentation

When running the backend, access the API documentation at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Environment Setup

### Frontend (.env)

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=

# Image Storage
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_API_KEY=
```

### Backend (.env)

```env
# MongoDB Configuration
MONGODB_URI=mongodb://mongodb:27017/kalamitra
DATABASE_NAME=kalamitra

# Firebase Configuration
FIREBASE_CREDENTIALS_PATH=
```

## Contributing

1. Follow the development guidelines
2. Write clear commit messages
3. Add appropriate documentation
4. Test your changes thoroughly
