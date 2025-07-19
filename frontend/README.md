# Kalamitra Frontend

The frontend application for Kalamitra, built with Next.js 14, TypeScript, and Tailwind CSS.

## Prerequisites

### Docker Setup (Recommended)

- Docker
- Docker Compose

### Manual Setup

- Node.js 18.x or higher
- npm 8.x or higher

## Getting Started

### Docker Setup (Recommended)

1. Set up environment variables:

   ```bash
   cp env.example .env
   ```

2. Build and run with Docker Compose:
   ```bash
   # From the project root directory
   docker-compose up --build
   ```
   The application will be available at `http://localhost:3000`

### Manual Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the environment variables:

   ```bash
   cp env.example .env
   ```

4. Update the `.env` file with your configuration

5. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
├── app/                    # App router directory
│   ├── artisan/           # Artisan-related pages
│   ├── marketplace/       # Marketplace pages
│   ├── orders/            # Order management pages
│   ├── product/           # Product pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # UI components
│   └── providers/        # Context providers
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── public/                # Static assets
└── styles/                # Global styles
```

## Key Features

- Next.js 14 App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Firebase Authentication
- Cloudinary for image storage
- Responsive design
- Docker containerization

## Development Guidelines

### Code Style

- Use TypeScript for all new files
- Follow the existing component structure
- Use CSS Modules or Tailwind for styling
- Implement responsive design using Tailwind breakpoints

### Component Guidelines

- Create reusable components in `components/ui`
- Use TypeScript interfaces for props
- Implement proper error handling
- Add loading states where necessary
- Follow atomic design principles
- Document component props using JSDoc

### State Management

- Use React hooks for local state
- Implement context for shared state
- Consider SWR for data fetching
- Follow the principle of lifting state up

### Performance

- Optimize images using Next.js Image component
- Implement proper loading states
- Use dynamic imports for code splitting
- Follow Next.js best practices
- Implement proper caching strategies
- Use React.memo for expensive components

### Error Handling

- Implement proper error boundaries
- Use toast notifications for errors
- Log errors to monitoring service
- Handle network errors gracefully

## Available Scripts

- `npm dev`: Start development server
- `npm build`: Build for production
- `npm start`: Start production server
- `npm lint`: Run ESLint

## Environment Variables

Required environment variables:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Analytics (Optional)
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Image Storage
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_API_KEY=
NEXT_PUBLIC_CLOUDINARY_API_SECRET=
```

## Deployment

### Docker Deployment (Recommended)

1. Build and run with Docker Compose:

   ```bash
   docker-compose up --build -d
   ```

2. Monitor the logs:
   ```bash
   docker-compose logs -f frontend
   ```

### Manual Deployment

1. Build the application:

   ```bash
   npm build
   ```

2. Test the production build:

   ```bash
   npm start
   ```

3. Deploy to your hosting platform of choice

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Troubleshooting

### Docker Issues

1. **Container not starting**

   - Check Docker logs: `docker-compose logs frontend`
   - Verify environment variables
   - Check port availability

2. **API Connection**
   - Ensure backend container is running
   - Check API URL in `.env`
   - Verify network connectivity between containers

### Common Issues

1. **Build Errors**

   - Clear `.next` directory
   - Remove `node_modules` and reinstall
   - Check Node.js version

2. **API Connection**

   - Verify API URL in `.env`
   - Check CORS configuration
   - Validate authentication tokens

3. **Image Loading**
   - Verify Cloudinary configuration
   - Check image formats and sizes
   - Validate image paths
