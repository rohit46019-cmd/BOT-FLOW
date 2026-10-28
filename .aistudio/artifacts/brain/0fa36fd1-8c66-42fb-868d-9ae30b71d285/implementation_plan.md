# Implementation Plan - Uptime Monitor

## Goal
Build a cloud-based uptime monitor that checks URLs every 5-6 minutes.
It will provide:
1. **Server-side monitoring**: Independent of the user's browser state.
2. **Management Dashboard**: Secure interface to add/edit/delete monitored URLs.
3. **Multi-channel Notifications**: Alerts via In-app, Email, and Browser notifications.
4. **Firebase Integration**: For user auth and persistent data storage.

## Architecture
- **Frontend**: React (Vite) + Tailwind CSS.
- **Authentication**: Firebase Authentication (Google Login).
- **Backend/Monitoring**: Node.js/Express server (running in the cloud) to perform periodic checks.
- **Database**: Firebase Firestore to store user settings, monitored URL lists, and status history.

## Steps
1. **Provision Firebase**: Set up Firestore and Auth.
2. **Data Modeling**: Define Firestore schema for `users`, `monitored_urls`, and `logs`.
3. **Frontend Implementation**: Build the dashboard to manage URLs and view status.
4. **Backend Implementation**: Implement the server-side cron job to ping URLs every 5-6 minutes.
5. **Notification System**: Set up in-app, email (using Firebase Extensions or a third-party service), and browser notification logic.
6. **Security**: Implement Firestore rules to ensure data isolation.
