FROM node:20-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy the entire project
COPY . .

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Build the application
RUN pnpm run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["pnpm", "start"]