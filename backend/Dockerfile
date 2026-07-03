FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# Expose port (default 1110)
EXPOSE 1110

# Start the server
CMD ["npm", "start"]
