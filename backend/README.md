# Kalamitra Backend API

This is the backend API for Kalamitra, built with FastAPI, MongoDB, and Firebase Authentication.

## Prerequisites

### Docker Setup (Recommended)
- Docker
- Docker Compose

### Manual Setup
- Python 3.8 or higher
- MongoDB 6.0 or higher
- Firebase project with Authentication enabled

## Project Structure

```
├── controllers/          # Business logic
│   └── userControllers.py
├── models/              # Data models
│   ├── artistModel.py
│   ├── listingModel.py
│   ├── profileModel.py
│   └── userModel.py
├── routes/              # API endpoints
│   ├── artists.py
│   ├── auth.py
│   ├── listing.py
│   └── users.py
├── services/            # External services
│   ├── database.py
│   └── generateListing.py
└── main.py             # Application entry point
```

## Setup

### Docker Setup (Recommended)

1. Ensure Docker and Docker Compose are installed

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration, using `mongodb` as the hostname for MongoDB:
   ```env
   MONGODB_URI=mongodb://mongodb:27017/kalamitra
   ```

3. Build and run the container:
   ```bash
   # From the project root directory
   docker-compose up --build
   ```
   The API will be available at `http://localhost:8000`

### Manual Setup

1. Create and activate virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   source .venv/bin/activate  # Unix/macOS
   ```

2. Install dependencies:
   ```bash
   pip install -r req.txt
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration.

4. Set up Firebase:
   - Create a Firebase project in the Firebase Console
   - Enable Authentication and select providers
   - Generate a service account key (JSON file)
   - Place the JSON file in the backend directory
   - Update the `FIREBASE_CREDENTIALS_PATH` in `.env`

5. Run the development server:
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available at `http://localhost:8000`

## API Documentation

Interactive API documentation is available at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Authentication Endpoints

- `POST /api/register` - Register a new user
- `POST /api/verify-token` - Verify Firebase ID token

### User Endpoints

- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `DELETE /api/users/me` - Delete user account

### Artist Endpoints

- `GET /api/artists/me` - Get current artist profile
- `PUT /api/artists/me` - Update artist profile
- `POST /api/artists/portfolio` - Add portfolio item
- `DELETE /api/artists/portfolio/{id}` - Remove portfolio item

### Listing Endpoints

- `GET /api/listings` - Get all listings
- `GET /api/listings/{id}` - Get listing by ID
- `POST /api/listings` - Create new listing
- `PUT /api/listings/{id}` - Update listing
- `DELETE /api/listings/{id}` - Delete listing

## Development Guidelines

### Code Style

- Follow PEP 8 style guide
- Use type hints for function parameters and return values
- Document functions and classes with docstrings
- Keep functions focused and single-purpose
- Use meaningful variable names
- Implement proper error handling

### API Design

- Use RESTful conventions
- Implement proper error handling
- Return appropriate HTTP status codes
- Validate request data using Pydantic models
- Document API endpoints thoroughly
- Version your APIs appropriately

### Database

- Use Motor for async MongoDB operations
- Define clear data models with Pydantic
- Implement proper indexing for performance
- Handle database errors gracefully
- Use transactions where necessary
- Implement data validation

### Authentication

- Validate Firebase tokens
- Implement role-based access control
- Secure sensitive routes
- Handle token expiration
- Implement rate limiting
- Log authentication events

### Security

- Implement input validation
- Use HTTPS in production
- Secure sensitive data
- Implement rate limiting
- Use secure headers
- Regular security audits
- Monitor for vulnerabilities

### Performance

- Optimize database queries
- Implement caching
- Use async operations
- Monitor response times
- Profile code performance
- Optimize resource usage

### Monitoring

- Set up logging
- Implement error tracking
- Monitor system metrics
- Set up alerts
- Track API usage
- Monitor database performance

## Deployment

### Docker Deployment

1. Build and run with Docker Compose:
   ```bash
   docker-compose up --build -d
   ```

2. Monitor the logs:
   ```bash
   docker-compose logs -f backend
   ```

### Manual Deployment

1. Build the application:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up production environment variables

3. Run with a production server:
   ```bash
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
   ```

## Open Source Libraries

Kalamitra's backend uses the following open-source libraries and frameworks:

### Libraries and Dependencies

#### Core Framework
- **FastAPI** `0.109.1` | MIT License | Direct integration
  - Source: [FastAPI GitHub](https://github.com/tiangolo/fastapi)
- **Uvicorn** `0.27.0` | BSD License | Direct integration
  - Source: [Uvicorn GitHub](https://github.com/encode/uvicorn)

#### Database
- **Motor** `3.7.1` | Apache License 2.0 | Direct integration
  - Source: [Motor GitHub](https://github.com/mongodb/motor)
- **PyMongo** `4.9.0` | Apache License 2.0 | Direct integration
  - Source: [PyMongo GitHub](https://github.com/mongodb/mongo-python-driver)

#### AI Services
- **Google Generative AI** `0.8.5` | Apache License 2.0 | Direct integration
  - Source: [Google Generative AI Python GitHub](https://github.com/google-ai-edge/generative-ai-python)
- **Firebase Admin** `6.4.0` | Apache License 2.0 | Direct integration
  - Source: [Firebase Admin SDK Python GitHub](https://github.com/firebase/firebase-admin-python)

#### Authentication
- **PyJWT** `2.10.1` | MIT License | Direct integration
  - Source: [PyJWT GitHub](https://github.com/jpadilla/pyjwt)

#### Image Processing
- **Pillow** `11.3.0` | PIL Software License | Direct integration
  - Source: [Pillow GitHub](https://github.com/python-pillow/Pillow)

#### HTTP
- **HTTPx** `0.28.1` | BSD License | Direct integration
  - Source: [HTTPx GitHub](https://github.com/encode/httpx)

#### Utilities
- **python-dotenv** `1.0.0` | BSD License | Direct integration
  - Source: [python-dotenv GitHub](https://github.com/theskumar/python-dotenv)

### License Summary

The backend primarily uses MIT, Apache 2.0, and BSD licensed libraries.

### Attribution Notice

The backend of Kalamitra relies on these open-source projects and we appreciate the contributions of these communities.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Troubleshooting

### Docker Issues

1. **Container not starting**
   - Check Docker logs: `docker-compose logs backend`
   - Verify environment variables
   - Check port availability

2. **MongoDB connection issues**
   - Ensure MongoDB container is running
   - Check MongoDB URI in `.env`
   - Verify network connectivity between containers

### Common Issues

1. **Database Connection**
   - Check MongoDB connection string
   - Verify database credentials
   - Check network connectivity

2. **Authentication**
   - Verify Firebase credentials
   - Check token validation
   - Confirm environment variables
