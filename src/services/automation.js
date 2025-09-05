import { NaukriService } from './naukri.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';

export class AutomationService {
  constructor() {
    this.services = [
      { name: 'Naukri', service: NaukriService }
    ];
  }

  async runWithRetries(serviceClass, serviceName, maxRetries = config.automation.maxRetries) {
    let attempt = 0;
    
    while (attempt < maxRetries) {
      attempt++;
      logger.info(`${serviceName} - Attempt ${attempt}/${maxRetries}`);
      
      try {
        const service = new serviceClass();
        const success = await service.run();
        
        if (success) {
          logger.info(`${serviceName} automation completed successfully`);
          return true;
        } else {
          logger.warn(`${serviceName} automation failed on attempt ${attempt}`);
        }
      } catch (error) {
        logger.error(`${serviceName} automation error on attempt ${attempt}:`, error);
      }
      
      if (attempt < maxRetries) {
        const delay = attempt * 5000; // Progressive delay
        logger.info(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    logger.error(`${serviceName} automation failed after ${maxRetries} attempts`);
    return false;
  }

  async runAll() {
    logger.info('Starting job automation process');
    const startTime = Date.now();
    const results = {};

    for (const { name, service } of this.services) {
      try {
        const success = await this.runWithRetries(service, name);
        results[name] = {
          success,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        logger.error(`Critical error in ${name} service:`, error);
        results[name] = {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }

    const duration = Date.now() - startTime;
    const successCount = Object.values(results).filter(r => r.success).length;
    const totalCount = this.services.length;

    logger.info(`Automation completed: ${successCount}/${totalCount} successful in ${duration}ms`);
    logger.info('Results:', results);

    return {
      success: successCount === totalCount,
      results,
      duration,
      timestamp: new Date().toISOString()
    };
  }
}