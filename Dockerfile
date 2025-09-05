FROM ghcr.io/puppeteer/puppeteer:latest

# Set working directory
WORKDIR /usr/src/app

# Set environment variable to indicate we're in Docker
ENV RUNNING_IN_DOCKER=true

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Create necessary directories
RUN mkdir -p /usr/src/app/logs /usr/src/app/screenshots /usr/src/app/resume

# Copy project files
COPY . .

# Handle resume file with error checking
RUN if [ -f "AshutoshResume.pdf" ]; then \
        echo "Found resume file in root directory"; \
        cp AshutoshResume.pdf /usr/src/app/resume/; \
        chmod 644 /usr/src/app/resume/AshutoshResume.pdf; \
        echo "Resume file copied to /usr/src/app/resume/"; \
        ls -l /usr/src/app/resume/; \
    else \
        echo "ERROR: Resume file not found in root directory"; \
        echo "Please ensure AshutoshResume.pdf exists in the project root"; \
        exit 1; \
    fi

# Set correct permissions
RUN chown -R pptruser:pptruser /usr/src/app

# Double verify resume file exists and is readable
RUN ls -la /usr/src/app/resume/AshutoshResume.pdf || (echo "Resume file not found" && exit 1)
RUN mkdir -p logs screenshots

# Set environment variables
ENV NODE_ENV=production \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    HEADLESS_MODE=true

# Copy docker environment file
COPY .env.docker /usr/src/app/.env

# Set permissions
RUN chmod 644 /usr/src/app/.env

# Start the application
CMD ["npm", "start"]
