FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose both frontend and backend ports
EXPOSE 3000 8000

# Default command (will be overridden by docker-compose service-specific commands)
CMD ["npm", "start"]