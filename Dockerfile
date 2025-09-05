FROM ghcr.io/puppeteer/puppeteer:24.10.2

# Create app directory and set permissions
USER root
RUN mkdir -p /usr/src/app && chown -R pptruser:pptruser /usr/src/app
WORKDIR /usr/src/app

# Set environment variable to indicate we're in Docker
ENV RUNNING_IN_DOCKER=true

# Switch to pptruser for all subsequent operations
USER pptruser

# Create necessary directories with correct ownership
RUN mkdir -p /usr/src/app/logs /usr/src/app/screenshots /usr/src/app/resume

# Copy package files with correct ownership
COPY --chown=pptruser:pptruser package*.json ./

# Install dependencies
RUN npm ci

# Copy project files with correct ownership
COPY --chown=pptruser:pptruser . .

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

# Double verify resume file exists and is readable
RUN ls -la /usr/src/app/resume/AshutoshResume.pdf || (echo "Resume file not found" && exit 1)

# Set environment variables
ENV NODE_ENV=production \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    HEADLESS_MODE=true

# Copy docker environment file with correct ownership
COPY --chown=pptruser:pptruser .env.docker /usr/src/app/.env
RUN chmod 644 /usr/src/app/.env

# Start the application
CMD ["npm", "start"]
