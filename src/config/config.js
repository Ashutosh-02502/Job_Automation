import dotenv from 'dotenv';

dotenv.config();

/**
 * Application configuration object
 * @typedef {Object} Config
 */
export const config = {
  /** Credentials for various services */
  credentials: {
    naukri: {
      email: process.env.NAUKRI_EMAIL,
      password: process.env.NAUKRI_PASSWORD
    }
  },
  
  /** Path to the resume file */
  resumePath: process.env.RESUME_PATH,
  
  /** Automation-related settings */
  automation: {
    /** Cron schedule for automation (default: 7 AM daily) */
    scheduleTime: process.env.SCHEDULE_TIME || '0 7 * * *',
    /** Whether to run in headless mode */
    headless: process.env.HEADLESS_MODE === 'true',
    /** Whether to take screenshots on errors */
    screenshotOnError: process.env.SCREENSHOT_ON_ERROR === 'true',
    /** Maximum retry attempts for failed operations */
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    /** Default timeout for operations (ms) */
    timeout: 30000,
    /** Default wait time between actions (ms) */
    waitTime: 2000
  },
  
  /** Logging configuration */
  logging: {
    /** Log level (default: info) */
    level: process.env.LOG_LEVEL || 'info',
    /** Log file path */
    file: process.env.LOG_FILE || 'automation.log'
  }
};

/**
 * Validates the required configuration values
 * @throws {Error} If any required configuration is missing
 * @returns {boolean} True if configuration is valid
 */
export function validateConfig() {
  const requiredFields = [
    { key: 'NAUKRI_EMAIL', value: config.credentials.naukri.email },
    { key: 'NAUKRI_PASSWORD', value: config.credentials.naukri.password },
    { key: 'RESUME_PATH', value: config.resumePath }
  ];
  
  const errors = requiredFields
    .filter(field => !field.value)
    .map(field => `${field.key} is required`);
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
  
  return true;
}