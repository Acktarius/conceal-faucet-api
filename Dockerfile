FROM node:18-alpine

# Install PM2 globally
RUN npm install -g pm2

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 3066

# Use pm2-runtime instead of node
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
