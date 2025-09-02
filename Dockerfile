FROM node:lts-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Debug: Check what's installed
RUN ls -la node_modules/

# Copy source code
COPY . .

CMD ["node", "index.js"]