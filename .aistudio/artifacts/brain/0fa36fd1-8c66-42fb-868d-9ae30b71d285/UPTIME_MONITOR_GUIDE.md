# 24/7 Uptime Monitor Guide

To prevent your bot application from going to sleep due to inactivity, you can use a free external service to "ping" your application regularly. This keeps your server active.

## Recommended Services
* **[UptimeRobot](https://uptimerobot.com/):** Offers a free plan that can check your URL every 5 minutes.
* **[Cron-job.org](https://cron-job.org/):** Another free, reliable service for scheduled tasks.

## Setup Instructions (using UptimeRobot)
1. **Sign up** for a free account at [UptimeRobot.com](https://uptimerobot.com/).
2. **Add a New Monitor:** Click on "Add New Monitor".
3. **Monitor Type:** Select "HTTP(s)".
4. **Friendly Name:** Give it a name (e.g., "My Bot Monitor").
5. **URL:** Enter the public URL of your application (e.g., `https://your-app-name.onrender.com`).
6. **Monitoring Interval:** Set this to "Every 5 minutes".
7. **Create:** Click "Create Monitor".

This will ensure your application receives a request at least every 5 minutes, preventing inactivity-related shutdowns.
