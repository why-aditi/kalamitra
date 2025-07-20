# Kalamitra - Artisan Marketplace Platform

Kalamitra is a full-stack marketplace platform connecting artisans with buyers, built with Next.js 14 and FastAPI.

Hosted Link: https://kalamitra-seven.vercel.app/

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
npm install
cp env.example .env
# Update .env with your configuration
npm run dev
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

## Open Source Libraries & Dependencies

Kalamitra leverages numerous open-source libraries and frameworks. Below is a comprehensive list of all dependencies with their licenses and roles:

### Frontend Dependencies

#### Core Framework & Runtime
- **Next.js** `15.2.4` | MIT License | Direct integration - Main React framework for SSR/SSG
  - Source: [https://github.com/vercel/next.js](https://github.com/vercel/next.js)
- **React** `^18.3.1` | MIT License | Direct integration - UI library for component-based architecture
  - Source: [https://github.com/facebook/react](https://github.com/facebook/react)
- **React DOM** `^18.3.1` | MIT License | Direct integration - React renderer for web browsers
  - Source: [https://github.com/facebook/react](https://github.com/facebook/react)
- **TypeScript** `^5` | Apache 2.0 License | Direct integration - Static type checking for JavaScript
  - Source: [https://github.com/microsoft/TypeScript](https://github.com/microsoft/TypeScript)

#### UI Components & Styling
- **Tailwind CSS** `^3.4.17` | MIT License | Direct integration - Utility-first CSS framework
  - Source: [https://github.com/tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss)
- **Radix UI** (Multiple packages) `1.1.x-2.2.x` | MIT License | Direct integration - Unstyled, accessible UI components
  - Source: [https://github.com/radix-ui/primitives](https://github.com/radix-ui/primitives)
- **Lucide React** `^0.454.0` | ISC License | Direct integration - Beautiful & consistent icon toolkit
  - Source: [https://github.com/lucide-icons/lucide](https://github.com/lucide-icons/lucide)
- **Class Variance Authority** `^0.7.1` | Apache 2.0 License | Direct integration - CSS-in-JS variants API
  - Source: [https://github.com/joe-bell/cva](https://github.com/joe-bell/cva)
- **clsx** `^2.1.1` | MIT License | Direct integration - Utility for constructing className strings
  - Source: [https://github.com/lukeed/clsx](https://github.com/lukeed/clsx)
- **Tailwind Merge** `^2.5.5` | MIT License | Direct integration - Merge Tailwind CSS classes without style conflicts
  - Source: [https://github.com/dcastil/tailwind-merge](https://github.com/dcastil/tailwind-merge)
- **Tailwind CSS Animate** `^1.0.7` | MIT License | Direct integration - Animation utilities for Tailwind CSS
  - Source: [https://github.com/midudev/tailwind-animatecss](https://github.com/midudev/tailwind-animatecss)

#### Form Handling & Validation
- **React Hook Form** `^7.54.1` | MIT License | Direct integration - Performant, flexible forms with easy validation
  - Source: [https://github.com/react-hook-form/react-hook-form](https://github.com/react-hook-form/react-hook-form)
- **Hookform Resolvers** `^3.9.1` | MIT License | Direct integration - Validation resolvers for React Hook Form
  - Source: [https://github.com/react-hook-form/resolvers](https://github.com/react-hook-form/resolvers)
- **Zod** `^3.24.1` | MIT License | Direct integration - TypeScript-first schema validation
  - Source: [https://github.com/colinhacks/zod](https://github.com/colinhacks/zod)

#### AI & Cloud Services
- **Google Generative AI** `^0.24.1` | Apache 2.0 License | Direct integration - Google's Generative AI SDK
  - Source: [https://github.com/google/generative-ai-js](https://github.com/google/generative-ai-js)
- **Google Cloud Translate** `^9.2.0` | Apache 2.0 License | Direct integration - Google Cloud Translation API
  - Source: [https://github.com/googleapis/nodejs-translate](https://github.com/googleapis/nodejs-translate)
- **Firebase** `^11.10.0` | Apache 2.0 License | Direct integration - Google's mobile and web development platform
  - Source: [https://github.com/firebase/firebase-js-sdk](https://github.com/firebase/firebase-js-sdk)

#### UI Enhancements
- **cmdk** `1.0.4` | MIT License | Direct integration - Command palette component
  - Source: [https://github.com/pacocoursey/cmdk](https://github.com/pacocoursey/cmdk)
- **Sonner** `^1.7.1` | MIT License | Direct integration - Opinionated toast component for React
  - Source: [https://github.com/emilkowalski/sonner](https://github.com/emilkowalski/sonner)
- **Vaul** `^0.9.6` | MIT License | Direct integration - Drawer component for React
  - Source: [https://github.com/emilkowalski/vaul](https://github.com/emilkowalski/vaul)
- **Embla Carousel React** `8.5.1` | MIT License | Direct integration - Carousel library for React
  - Source: [https://github.com/davidjerleke/embla-carousel](https://github.com/davidjerleke/embla-carousel)
- **React Resizable Panels** `^2.1.7` | MIT License | Direct integration - React components for resizable panel groups
  - Source: [https://github.com/bvaughn/react-resizable-panels](https://github.com/bvaughn/react-resizable-panels)
- **React Speech Recognition** `^4.0.1` | MIT License | Direct integration - React hook for Speech Recognition API
  - Source: [https://github.com/JamesBrill/react-speech-recognition](https://github.com/JamesBrill/react-speech-recognition)

#### Date & Time
- **date-fns** `^2.30.0` | MIT License | Direct integration - Modern JavaScript date utility library
  - Source: [https://github.com/date-fns/date-fns](https://github.com/date-fns/date-fns)
- **React Day Picker** `^8.9.0` | MIT License | Direct integration - Date picker component for React
  - Source: [https://github.com/gpbl/react-day-picker](https://github.com/gpbl/react-day-picker)

#### Data Visualization
- **Recharts** `2.15.0` | MIT License | Direct integration - Composable charting library built on React components
  - Source: [https://github.com/recharts/recharts](https://github.com/recharts/recharts)

#### Specialized Components
- **Input OTP** `1.4.1` | MIT License | Direct integration - One-time password input component
  - Source: [https://github.com/guilhermerodz/input-otp](https://github.com/guilhermerodz/input-otp)

#### Build Tools & Development
- **Autoprefixer** `^10.4.20` | MIT License | Direct integration - PostCSS plugin to parse CSS and add vendor prefixes
  - Source: [https://github.com/postcss/autoprefixer](https://github.com/postcss/autoprefixer)
- **PostCSS** `^8.5` | MIT License | Direct integration - Tool for transforming CSS with JavaScript
  - Source: [https://github.com/postcss/postcss](https://github.com/postcss/postcss)

#### Type Definitions
- **@types/node** `^22` | MIT License | Direct integration - TypeScript definitions for Node.js
  - Source: [https://github.com/DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped)
- **@types/react** `^19` | MIT License | Direct integration - TypeScript definitions for React
  - Source: [https://github.com/DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped)
- **@types/react-dom** `^19` | MIT License | Direct integration - TypeScript definitions for React DOM
  - Source: [https://github.com/DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped)
- **@types/react-speech-recognition** `^3.9.6` | MIT License | Direct integration - TypeScript definitions for React Speech Recognition
  - Source: [https://github.com/DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped)

### Backend Dependencies

#### Core Framework
- **FastAPI** `0.109.1` | MIT License | Direct integration - Modern, fast web framework for building APIs with Python
  - Source: [https://github.com/tiangolo/fastapi](https://github.com/tiangolo/fastapi)
- **Uvicorn** `0.27.0` | BSD 3-Clause License | Direct integration - Lightning-fast ASGI server
  - Source: [https://github.com/encode/uvicorn](https://github.com/encode/uvicorn)
- **Starlette** `0.35.1` | BSD 3-Clause License | Direct integration - Lightweight ASGI framework (FastAPI dependency)
  - Source: [https://github.com/encode/starlette](https://github.com/encode/starlette)

#### Data Validation & Serialization
- **Pydantic** `2.11.7` | MIT License | Direct integration - Data validation using Python type hints
  - Source: [https://github.com/pydantic/pydantic](https://github.com/pydantic/pydantic)
- **Pydantic Core** `2.33.2` | MIT License | Direct integration - Core validation logic for Pydantic
  - Source: [https://github.com/pydantic/pydantic-core](https://github.com/pydantic/pydantic-core)
- **Pydantic Settings** `2.10.1` | MIT License | Direct integration - Settings management using Pydantic
  - Source: [https://github.com/pydantic/pydantic-settings](https://github.com/pydantic/pydantic-settings)
- **Pydantic Extra Types** `2.10.5` | MIT License | Direct integration - Extra types for Pydantic
  - Source: [https://github.com/pydantic/pydantic-extra-types](https://github.com/pydantic/pydantic-extra-types)

#### Database & Storage
- **Motor** `3.7.1` | Apache 2.0 License | Direct integration - Async Python driver for MongoDB
  - Source: [https://github.com/mongodb/motor](https://github.com/mongodb/motor)
- **PyMongo** `4.9.0` | Apache 2.0 License | Direct integration - MongoDB driver for Python
  - Source: [https://github.com/mongodb/mongo-python-driver](https://github.com/mongodb/mongo-python-driver)

#### Authentication & Security
- **Firebase Admin** `6.4.0` | Apache 2.0 License | Direct integration - Firebase Admin SDK for Python
  - Source: [https://github.com/firebase/firebase-admin-python](https://github.com/firebase/firebase-admin-python)
- **PyJWT** `2.10.1` | MIT License | Direct integration - JSON Web Token implementation in Python
  - Source: [https://github.com/jpadilla/pyjwt](https://github.com/jpadilla/pyjwt)
- **python-jose** `3.3.0` | MIT License | Direct integration - JavaScript Object Signing and Encryption implementation
  - Source: [https://github.com/mpdavis/python-jose](https://github.com/mpdavis/python-jose)
- **Cryptography** `45.0.5` | BSD/Apache 2.0 License | Direct integration - Cryptographic recipes and primitives
  - Source: [https://github.com/pyca/cryptography](https://github.com/pyca/cryptography)

#### Google Cloud & AI Services
- **Google Generative AI** `0.8.5` | Apache 2.0 License | Direct integration - Google's Generative AI SDK for Python
  - Source: [https://github.com/google-ai-edge/generative-ai-python](https://github.com/google-ai-edge/generative-ai-python)
- **Google Cloud Storage** `3.2.0` | Apache 2.0 License | Direct integration - Google Cloud Storage client library
  - Source: [https://github.com/googleapis/python-storage](https://github.com/googleapis/python-storage)
- **Google Cloud Firestore** `2.21.0` | Apache 2.0 License | Direct integration - Google Cloud Firestore client library
  - Source: [https://github.com/googleapis/python-firestore](https://github.com/googleapis/python-firestore)
- **Google API Python Client** `2.176.0` | Apache 2.0 License | Direct integration - Google API client library
  - Source: [https://github.com/googleapis/google-api-python-client](https://github.com/googleapis/google-api-python-client)
- **Google Auth** `2.40.3` | Apache 2.0 License | Direct integration - Google authentication library
  - Source: [https://github.com/googleapis/google-auth-library-python](https://github.com/googleapis/google-auth-library-python)

#### Image Processing
- **Pillow** `11.3.0` | PIL Software License | Direct integration - Python Imaging Library
  - Source: [https://github.com/python-pillow/Pillow](https://github.com/python-pillow/Pillow)

#### HTTP & Networking
- **HTTPx** `0.28.1` | BSD 3-Clause License | Direct integration - Next generation HTTP client for Python
  - Source: [https://github.com/encode/httpx](https://github.com/encode/httpx)
- **Requests** `2.32.4` | Apache 2.0 License | Direct integration - HTTP library for Python
  - Source: [https://github.com/psf/requests](https://github.com/psf/requests)

#### Payment Processing
- **Stripe** `4.0.2` | MIT License | Direct integration - Python library for Stripe API
  - Source: [https://github.com/stripe/stripe-python](https://github.com/stripe/stripe-python)

#### Utilities & Tools
- **python-dotenv** `1.0.0` | BSD 3-Clause License | Direct integration - Environment variables from .env file
  - Source: [https://github.com/theskumar/python-dotenv](https://github.com/theskumar/python-dotenv)
- **python-multipart** `0.0.9` | Apache 2.0 License | Direct integration - Multipart form data parser
  - Source: [https://github.com/andrew-d/python-multipart](https://github.com/andrew-d/python-multipart)
- **Click** `8.2.1` | BSD 3-Clause License | Direct integration - Command line interface creation toolkit
  - Source: [https://github.com/pallets/click](https://github.com/pallets/click)
- **Typer** `0.16.0` | MIT License | Direct integration - Library for building CLI applications
  - Source: [https://github.com/tiangolo/typer](https://github.com/tiangolo/typer)

#### Data Formats & Serialization
- **orjson** `3.10.18` | Apache 2.0/MIT License | Direct integration - Fast JSON library for Python
  - Source: [https://github.com/ijl/orjson](https://github.com/ijl/orjson)
- **ujson** `5.10.0` | BSD 3-Clause License | Direct integration - Ultra fast JSON encoder and decoder
  - Source: [https://github.com/ultrajson/ultrajson](https://github.com/ultrajson/ultrajson)
- **PyYAML** `6.0.2` | MIT License | Direct integration - YAML parser and emitter for Python
  - Source: [https://github.com/yaml/pyyaml](https://github.com/yaml/pyyaml)

#### Monitoring & Error Tracking
- **Sentry SDK** `2.32.0` | MIT License | Direct integration - Error tracking and performance monitoring
  - Source: [https://github.com/getsentry/sentry-python](https://github.com/getsentry/sentry-python)

#### Development Tools
- **Rich** `14.0.0` | MIT License | Direct integration - Rich text and beautiful formatting in the terminal
  - Source: [https://github.com/Textualize/rich](https://github.com/Textualize/rich)
- **Watchfiles** `1.1.0` | MIT License | Direct integration - Simple, modern file watching and code reload
  - Source: [https://github.com/samuelcolvin/watchfiles](https://github.com/samuelcolvin/watchfiles)

### License Summary

- **MIT License**: Majority of dependencies (most permissive)
- **Apache 2.0 License**: Google Cloud services, FastAPI ecosystem
- **BSD 3-Clause License**: HTTP clients, utilities
- **ISC License**: Icons, utilities
- **PIL Software License**: Image processing (Pillow)

### Attribution Notice

This project is built upon the excellent work of the open-source community. We acknowledge and thank all contributors to the libraries and frameworks that make Kalamitra possible. Each dependency is used in compliance with its respective license terms.

## Contributing

1. Follow the development guidelines
2. Write clear commit messages
3. Add appropriate documentation
4. Test your changes thoroughly
5. Respect all open-source licenses and attributions
