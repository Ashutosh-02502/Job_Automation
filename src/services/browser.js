/**
 * Base browser automation service providing common functionality
 * for website interaction and automation tasks.
 */

import puppeteer from 'puppeteer';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

// Browser configuration options
const BROWSER_OPTIONS = {
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--disable-blink-features=AutomationControlled',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process'
  ],
  defaultViewport: { width: 1920, height: 1080 },
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null, // For Docker compatibility
  ignoreHTTPSErrors: true // Handle SSL issues in different environments
};

export class BrowserService {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    try {
      // Launch browser with configuration
      this.browser = await puppeteer.launch({
        headless: config.automation.headless ? "new" : false,
        ...BROWSER_OPTIONS
      });

      this.page = await this.browser.newPage();
      
      // Set user agent to avoid detection
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Set viewport
      await this.page.setViewport({ width: 1366, height: 768 });
      
      // Set default timeout
      this.page.setDefaultTimeout(config.automation.timeout);
      
      logger.info('Browser initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  async takeScreenshot(filename) {
    if (!config.automation.screenshotOnError) return;
    
    try {
      const screenshotDir = 'screenshots';
      await fs.mkdir(screenshotDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = path.join(screenshotDir, `${filename}-${timestamp}.png`);
      
      await this.page.screenshot({ 
        path: screenshotPath,
        fullPage: true 
      });
      
      logger.info(`Screenshot saved: ${screenshotPath}`);
    } catch (error) {
      logger.error('Failed to take screenshot:', error);
    }
  }

  async waitForElement(selector, timeout = config.automation.timeout) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      logger.error(`Element not found: ${selector}`, error);
      return false;
    }
  }

  /**
   * Safely clicks an element after ensuring it's visible
   * @param {string} selector - CSS selector for the element
   * @param {string} description - Human-readable description for logging
   * @returns {Promise<boolean>} Success status
   */
  async safeClick(selector, description = '') {
    try {
      await this.page.waitForSelector(selector, { visible: true });
      await this.page.click(selector);
      await this.page.waitForTimeout(config.automation.waitTime);
      logger.info(`Clicked: ${description || selector}`);
      return true;
    } catch (error) {
      logger.error(`Failed to click ${description || selector}:`, error);
      await this.takeScreenshot(`click-error-${Date.now()}`);
      return false;
    }
  }

  /**
   * Safely types text into an input field
   * @param {string} selector - CSS selector for the input
   * @param {string} text - Text to type
   * @param {string} description - Human-readable description for logging
   * @returns {Promise<boolean>} Success status
   */
  async safeType(selector, text, description = '') {
    try {
      await this.page.waitForSelector(selector, { visible: true });
      await this.page.click(selector);
      // Clear existing text
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('KeyA');
      await this.page.keyboard.up('Control');
      await this.page.type(selector, text);
      await this.page.waitForTimeout(config.automation.waitTime);
      logger.info(`Typed in: ${description || selector}`);
      return true;
    } catch (error) {
      logger.error(`Failed to type in ${description || selector}:`, error);
      await this.takeScreenshot(`type-error-${Date.now()}`);
      return false;
    }
  }

  async uploadFile(selector, filePath, description = '') {
    try {
      // Verify resume file exists and log full path
      try {
        const path = await import('path');
        const fs = await import('fs/promises');
        
        // Try paths in order of deployment preference
        const isDocker = process.env.RUNNING_IN_DOCKER === 'true';
        logger.info(`Running in Docker: ${isDocker}`);
        
        const possiblePaths = [
          // If a specific path was provided, try it first
          filePath,
          // Docker path (will be primary in deployment)
          '/usr/src/app/resume/AshutoshResume.pdf',
          // Local development paths
          path.join(process.cwd(), 'AshutoshResume.pdf'),
          path.join(process.cwd(), 'resume', 'AshutoshResume.pdf')
        ];

        let foundPath = null;
        for (const p of possiblePaths) {
          try {
            logger.debug(`Checking resume path: ${p}`);
            await fs.access(p);
            foundPath = p;
            break;
          } catch (error) {
            logger.debug(`Resume not found at ${p}`);
          }
        }

        if (!foundPath) {
          throw new Error('Resume file not found in any of the expected locations');
        }

        logger.info(`Resume file found at: ${foundPath}`);
        filePath = foundPath; // Use the found path
      } catch (error) {
        throw new Error(`Resume file access error: ${error.message}`);
      }
      await this.page.waitForSelector(selector);
      const input = await this.page.$(selector);
      await input.uploadFile(filePath);
      await this.page.waitForTimeout(config.automation.waitTime * 2);
      logger.info(`File uploaded: ${description || selector}`);
      return true;
    } catch (error) {
      logger.error(`Failed to upload file to ${description || selector}:`, error);
      await this.takeScreenshot(`upload-error-${Date.now()}`);
      return false;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      logger.info('Browser closed');
    }
  }
}