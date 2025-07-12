# Kalamitra Backend API

This is the backend API for Kalamitra, built with FastAPI and Firebase Authentication.

## Setup

1. Install dependencies:

```bash
python -m venv .venv
source .venv/Scripts/activate
pip install -r req.txt
```

2. Set up Firebase:

   - Create a Firebase project in the Firebase Console
   - Generate a service account key (JSON file)
   - Place the JSON file in the backend directory
   - Update the path in `main.py` to point to your service account key

3. Run the server:

```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access the interactive API documentation at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/verify-token` - Verify Firebase ID token

### User Endpoints

- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `DELETE /api/users/me` - Delete user account

### Artist Endpoints

- `GET /api/artists/me` - Get current artist profile
- `PUT /api/artists/me` - Update current artist profile

## Role-Based Access Control

The API implements two roles:

1. `user` - Regular user role (default)
2. `artist` - Artist role with additional privileges

Roles are managed through Firebase Custom Claims and verified on protected endpoints.

## Security

- Authentication is handled through Firebase
- All endpoints use HTTPS
- CORS is configured (update the allowed origins in production)
- Input validation using Pydantic models
- Role-based access control using Firebase Custom Claims
