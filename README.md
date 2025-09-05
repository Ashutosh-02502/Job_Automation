# Job Automation Agent

An automated system that logs into your Naukri and Instahyre accounts daily to update your resume, keeping your profile active and visible to recruiters.

## ⚠️ Important Disclaimers

**Legal & Terms of Service**: This automation tool interacts with third-party websites. Please ensure you comply with:
- Naukri.com Terms of Service
- Instahyre.com Terms of Service  
- Your local laws regarding web automation

**Security**: This tool requires storing your login credentials. Use strong, unique passwords and ensure your `.env` file is properly secured.

**Reliability**: Web automation can break if websites change their structure. Monitor logs regularly and be prepared to update selectors.

## Features

- 🤖 Automated login to Naukri and Instahyre
- 📄 Daily resume upload/update at 7 AM
- 🔄 Retry mechanism with exponential backoff  
- 📊 Comprehensive logging with timestamps
- 📸 Screenshot capture on errors
- 🛡️ Secure credential management
- ⚡ Headless browser automation
- 📅 Flexible scheduling system

## Setup Instructions

### 1. Clone and Install Dependencies

The dependencies are already installed. The Chrome browser for Puppeteer will be automatically installed during setup.

If you encounter browser installation issues, manually install Chrome for Puppeteer:

```bash
npm run install-browser
```

Now configure your credentials:

### 2. Configure Credentials

Copy `.env.example` to `.env` and fill in your details:

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials:

```env
# Job Portal Credentials  
NAUKRI_EMAIL=your.email@example.com
NAUKRI_PASSWORD=your_naukri_password
INSTAHYRE_EMAIL=your.email@example.com  
INSTAHYRE_PASSWORD=your_instahyre_password

# Resume File Path (absolute path recommended)
RESUME_PATH=/absolute/path/to/your/resume.pdf

# Automation Settings
SCHEDULE_TIME=0 7 * * *  # Daily at 7 AM
HEADLESS_MODE=true
SCREENSHOT_ON_ERROR=true
MAX_RETRIES=3
```

### 3. Add Your Resume

Place your resume file in the project directory or specify the full path in the `RESUME_PATH` variable. Supported formats: PDF, DOC, DOCX.

### 4. Test the Setup

Run a one-time test to ensure everything works:

```bash
npm run dev -- --run-once
```

Or:

```bash
npm start -- -o
```

### 5. Start Automated Scheduling

For continuous automated operation:

```bash
npm start
```

The application will run continuously and execute the automation daily at 7 AM.

## Usage

### Commands

- `npm start` - Start the scheduler (runs continuously)
- `npm run dev` - Development mode with file watching
- `npm start -- --run-once` - Run automation once and exit
- `npm start -- -o` - Short form of run-once

### Monitoring

- **Logs**: Check `logs/automation.log` for detailed execution logs
- **Error Logs**: Check `logs/error.log` for error-specific logs  
- **Screenshots**: Error screenshots saved in `screenshots/` directory
- **Console Output**: Real-time status updates

## Configuration Options

### Schedule Time (Cron Format)
```env
SCHEDULE_TIME=0 7 * * *   # Daily at 7:00 AM
SCHEDULE_TIME=0 9 * * 1-5 # Weekdays at 9:00 AM
SCHEDULE_TIME=30 6 * * *  # Daily at 6:30 AM
```

### Browser Settings
```env
HEADLESS_MODE=true        # Run browser in background
HEADLESS_MODE=false       # Show browser window (debugging)
SCREENSHOT_ON_ERROR=true  # Capture screenshots on failures
MAX_RETRIES=3            # Number of retry attempts
```

## Troubleshooting

### Common Issues

1. **Login Failed**
   - Verify credentials in `.env` file
   - Check if websites have changed their login process
   - Ensure no 2FA is enabled (not supported)

2. **Resume Upload Failed**
   - Verify resume file path and permissions
   - Ensure file format is supported (PDF, DOC, DOCX)
   - Check file size limits

3. **Automation Stopped**
   - Check logs for specific error messages
   - Verify internet connection
   - Restart the application

### Debugging

1. **Enable Visual Mode**:
   ```env
   HEADLESS_MODE=false
   ```

2. **Check Screenshots**:
   Error screenshots are saved in `screenshots/` directory

3. **Review Logs**:
   ```bash
   tail -f logs/automation.log
   ```

## File Structure

```
job-automation-agent/
├── src/
│   ├── config/
│   │   └── config.js         # Configuration management
│   ├── services/
│   │   ├── automation.js     # Main automation orchestrator
│   │   ├── browser.js        # Browser automation utilities
│   │   ├── naukri.js        # Naukri-specific automation
│   │   └── instahyre.js     # Instahyre-specific automation
│   ├── utils/
│   │   └── logger.js        # Logging configuration
│   └── scheduler.js         # Cron job scheduler
├── logs/                    # Application logs
├── screenshots/             # Error screenshots
├── .env                     # Your credentials (keep secret!)
├── .env.example            # Template for credentials
├── index.js                # Application entry point
└── README.md               # This file
```

## Security Best Practices

1. **Never commit `.env` file to version control**
2. **Use strong, unique passwords for job portals**  
3. **Regularly rotate your passwords**
4. **Monitor logs for unusual activity**
5. **Keep your resume file secure**
6. **Run on a secure, private network**

## Support

If you encounter issues:

1. Check the troubleshooting section
2. Review error logs in `logs/error.log`
3. Enable visual mode for debugging
4. Ensure website structures haven't changed

## License

This tool is for personal use only. Please respect the terms of service of the job portals you're automating.