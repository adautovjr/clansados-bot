FROM node:lts-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

RUN apt get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

CMD ["npm", "start"]