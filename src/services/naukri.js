/**
 * Naukri.com automation service
 * Handles login, resume upload, and logout operations
 */

import { BrowserService } from './browser.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

// Selectors for Naukri.com elements
const SELECTORS = {
  LOGIN: {
    EMAIL: '#usernameField',
    PASSWORD: 'input[type="password"], input[name="password"], #passwordField',
    SUBMIT: 'button[type="submit"]'
  },
  PROFILE: {
    ICON: 'img.nI-gNb-icon-img',
    USER_IMG: 'img.nI-gNb-user-img',
    RESUME_CONTAINER: '.resume-upload-container',
    UPLOAD_INPUT: '.resume-upload-container input[type="file"].upload-input',
    UPDATE_BUTTON: 'button.btn.upload-button'
  }
};

export class NaukriService extends BrowserService {
  constructor() {
    super();
    this.baseUrl = 'https://www.naukri.com';
  }

  /**
   * Handles the login process for Naukri.com
   * @returns {Promise<boolean>} Login success status
   */
  async login() {
    try {
      logger.info('Starting Naukri login process');
      
      // Navigate to login page
      await this.page.goto(`${this.baseUrl}/nlogin/login`, {
        waitUntil: 'networkidle2'
      });

      // Handle email input
      const emailSuccess = await this.safeType(
        SELECTORS.LOGIN.EMAIL,
        config.credentials.naukri.email,
        'Email field'
      );
      if (!emailSuccess) throw new Error('Failed to enter email');

      // Handle password input
      const passwordSuccess = await this.safeType(
        SELECTORS.LOGIN.PASSWORD,
        config.credentials.naukri.password,
        'Password field'
      );
      if (!passwordSuccess) throw new Error('Failed to enter password');

      // Click login button and handle potential CAPTCHA
      const loginSuccess = await this.safeClick(
        'button[type="submit"]',
        'Login button'
      );
      if (!loginSuccess) throw new Error('Failed to click login button');
      
      // Wait for potential CAPTCHA or error messages
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for CAPTCHA
      const hasCaptcha = await this.page.evaluate(() => {
        return document.body.textContent.toLowerCase().includes('captcha') ||
               document.body.innerHTML.toLowerCase().includes('robot');
      });
      
      if (hasCaptcha) {
        throw new Error('CAPTCHA detected - manual intervention required');
      }

      // Wait for navigation and profile image to appear
      await this.wait(8000); // Increased wait time for page load

      // Check for login success by looking for the profile image
      const isLoggedIn = await this.page.evaluate(() => {
        const profileImg = document.querySelector('img.nI-gNb-icon-img');
        const userImg = document.querySelector('img.nI-gNb-user-img');
        return profileImg !== null || userImg !== null;
      });
      
      if (!isLoggedIn) {
        // Take screenshot for debugging
        await this.takeScreenshot('login-verification-failed');
        throw new Error('Login verification failed');
      }

      logger.info('Naukri login successful');
      return true;
    } catch (error) {
      logger.error('Naukri login failed:', error);
      await this.takeScreenshot('naukri-login-error');
      return false;
    }
  }

  /**
   * Updates the resume on Naukri.com profile
   * @returns {Promise<boolean>} Update success status
   */
  async updateResume() {
    try {
      logger.info('Starting Naukri resume update');

      // Navigate to profile section
      await this.waitForElement(SELECTORS.PROFILE.ICON);
      await this.safeClick(SELECTORS.PROFILE.ICON, 'Profile icon');
      
      // Wait for menu animation
      await this.wait(3000);
      
      // Navigate to profile details
      await this.safeClick(SELECTORS.PROFILE.USER_IMG, 'Profile section');
      
      // Wait for profile page load
      await this.wait(5000);

      // Verify resume upload section
      const uploadContainer = await this.waitForElement(SELECTORS.PROFILE.RESUME_CONTAINER);
      if (!uploadContainer) {
        await this.takeScreenshot('resume-container-not-found');
        throw new Error('Could not find resume upload section');
      }

      // Find the file input with the exact selector from HTML
      const fileInputSelector = '.resume-upload-container input[type="file"].upload-input';
      const uploadSuccess = await this.uploadFile(
        fileInputSelector,
        config.resumePath,
        'Resume upload'
      );

      if (!uploadSuccess) {
        throw new Error('Failed to upload resume file');
      }

      // Wait for upload to process
      await this.wait(5000);

      // Click the update button with exact selector
      const updateSuccess = await this.safeClick(
        'button.btn.upload-button',
        'Update resume button'
      );

      if (!updateSuccess) {
        await this.takeScreenshot('update-button-click-failed');
        throw new Error('Failed to click update button');
      }

      // Wait for upload confirmation
      await this.wait(5000);
      
      // Verify upload success
      const uploadStatus = await this.page.evaluate(() => {
        const errorElement = document.querySelector('.upload-error');
        return !errorElement;
      });
      
      if (!uploadStatus) {
        throw new Error('Resume upload failed - error message detected');
      }

      logger.info('Naukri resume updated successfully');
      return true;
    } catch (error) {
      logger.error('Naukri resume update failed:', error);
      await this.takeScreenshot('naukri-resume-error');
      return false;
    }
  }

  async logout() {
    try {
      logger.info('Logging out from Naukri');
      
      // Click profile image to open menu
      await this.waitForElement('img.nI-gNb-icon-img');
      await this.safeClick('img.nI-gNb-icon-img', 'Profile menu');
      
      // Wait for menu with increased timeout
      await this.wait(3000);
      
      // Try multiple selectors for logout
      const logoutSuccess = await this.page.evaluate(async () => {
        const selectors = [
          'a[href*="logout"]',
          'a.logout-link',
          'a[title*="Logout"]',
          'a.nI-gNb-logout',
          'div[title="Logout"]'
        ];
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            element.click();
            return true;
          }
        }
        return false;
      });

      if (!logoutSuccess) {
        await this.takeScreenshot('logout-button-not-found');
        throw new Error('Could not find logout button');
      }
      
      // Wait for logout to complete
      await this.wait(5000);
      
      // Wait for page to load after logout
      await this.wait(5000); // 5 seconds should be enough
      
      // Verify logout by checking for login page elements
      try {
        await this.page.waitForSelector('#usernameField', { timeout: 10000 }); // 10 seconds timeout
        logger.info('Logged out successfully - Login page detected');
      } catch (error) {
        throw new Error('Logout verification failed - Login page not found');
      }
      return true;
    } catch (error) {
      logger.error('Logout failed:', error);
      await this.takeScreenshot('logout-error');
      return false;
    }
  }

  async run() {
    try {
      await this.initialize();
      
      const loginSuccess = await this.login();
      if (!loginSuccess) {
        throw new Error('Login failed');
      }

      const updateSuccess = await this.updateResume();
      if (!updateSuccess) {
        throw new Error('Resume update failed');
      }

      await this.logout();

      logger.info('Naukri automation completed successfully');
      return true;
    } catch (error) {
      logger.error('Naukri automation failed:', error);
      return false;
    } finally {
      await this.close();
    }
  }
}