FROM node:lts-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install build dependencies for node-canvas and similar packages
RUN apk add --no-cache build-base cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

CMD ["npm", "start"]