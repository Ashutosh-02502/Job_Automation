import { Scheduler } from './src/scheduler.js';
import { logger } from './src/utils/logger.js';
import fs from 'fs/promises';

async function createDirectories() {
  const dirs = ['logs', 'screenshots'];
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory already exists, ignore
    }
  }
}

// Health check function for container monitoring
async function startHealthCheck() {
  const interval = 5 * 60 * 1000; // 5 minutes
  
  // Create a basic HTTP server for Render health checks
  if (process.env.NODE_ENV === 'production') {
    const http = await import('http');
    const server = http.createServer((req, res) => {
      res.writeHead(200);
      res.end('OK');
    });
    server.listen(process.env.PORT || 3000);
    logger.info(`Health check server listening on port ${process.env.PORT || 3000}`);
  }

  setInterval(() => {
    try {
      logger.info('Health check: Service is running');
      const memoryUsage = process.memoryUsage();
      logger.info(`Memory usage: ${JSON.stringify({
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`
      })}`);
    } catch (error) {
      logger.error('Health check failed:', error);
    }
  }, interval);
}

async function main() {
  try {
    // Create necessary directories
    await createDirectories();

    logger.info('Job Automation Agent Starting...');
    logger.info('='.repeat(50));

    const scheduler = new Scheduler();

    // Handle command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--run-once') || args.includes('-o')) {
      logger.info('Running automation once and exiting...');
      await scheduler.runOnce();
      process.exit(0);
    } else {
      // Start scheduler
      await scheduler.start();
    }

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      process.exit(0);
    });

    // Keep the process running
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Application failed to start:', error);
    process.exit(1);
  }
}

main();