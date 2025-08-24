FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create .next directory with proper permissions
RUN mkdir -p /app/.next && chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

# Default command
CMD ["npm", "run", "dev"]