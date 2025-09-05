import cron from 'node-cron';
import { AutomationService } from './services/automation.js';
import { logger } from './utils/logger.js';
import { config, validateConfig } from './config/config.js';

export class Scheduler {
  constructor() {
    this.automation = new AutomationService();
    this.isRunning = false;
  }

  async start() {
    try {
      // Validate configuration
      validateConfig();
      logger.info('Configuration validated successfully');

      // Validate cron expression
      if (!cron.validate(config.automation.scheduleTime)) {
        throw new Error(`Invalid cron expression: ${config.automation.scheduleTime}`);
      }

      logger.info(`Scheduling job automation for: ${config.automation.scheduleTime}`);
      logger.info('Next execution will be at:', this.getNextExecution());

      // Schedule the automation with timezone
      cron.schedule(config.automation.scheduleTime, async () => {
        if (this.isRunning) {
          logger.warn('Previous automation still running, skipping this execution');
          return;
        }

        this.isRunning = true;
        const now = new Date();
        logger.info(`Scheduled automation starting at ${now.toISOString()} (${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })})`);
        
        // Set a timeout for the automation
        const automationTimeout = setTimeout(() => {
          if (this.isRunning) {
            logger.error('Automation timeout reached. Force stopping...');
            this.isRunning = false;
          }
        }, 30 * 60 * 1000); // 30 minutes timeout
        
        try {
          await this.automation.runAll();
        } catch (error) {
          logger.error('Scheduled automation failed:', error);
        } finally {
          this.isRunning = false;
        }
      }, {
        timezone: "Asia/Kolkata" // Adjust timezone as needed
      });

      logger.info('Job automation scheduler started successfully');
      logger.info('Press Ctrl+C to stop the scheduler');

    } catch (error) {
      logger.error('Failed to start scheduler:', error);
      process.exit(1);
    }
  }

  getNextExecution() {
    const cronParser = cron.schedule(config.automation.scheduleTime, () => {}, {
      scheduled: false
    });
    
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Simplified for demo
  }

  async runOnce() {
    if (this.isRunning) {
      logger.warn('Automation is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Running one-time automation...');
    
    try {
      await this.automation.runAll();
    } catch (error) {
      logger.error('One-time automation failed:', error);
    } finally {
      this.isRunning = false;
    }
  }
}