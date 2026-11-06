# Implementation Plan - BotFlow Premium (Python Transition)

## Goal
Transform BotFlow into a high-performance Telegram manager with a Python-based backend, ensuring multi-user data synchronization via Firebase Firestore and resolving scanning latency/data loss issues.

## Architecture
- **Backend**: FastAPI (Python) running on port 3000.
  - **Reasoning**: FastAPI is highly performant and allows direct integration of the `fast_scanner.py` logic without the overhead of inter-process communication.
- **Frontend**: React (Vite) + Tailwind CSS.
  - **Interaction**: The frontend will communicate with the Python API for all operations.
- **Database**: Firebase Firestore.
  - **Sync**: Replaces SQLite/MongoDB to allow "Other users" to see Rules, Logs, and Scanned Items in real-time.
- **Authentication**: Firebase Auth (for multi-user support).

## Key Features & Fixes
1. **Multi-User Sync**: All data (Rules, Scanned Items, Logs) will be stored in Firestore.
2. **Persistent Scanning**: Scanned Items will be saved to Firestore immediately. The "delete on back" issue will be fixed by fetching from Firestore on navigation.
3. **High-Speed Scanning**: The `FastKeywordMatcher` will be held in memory within the FastAPI process for sub-millisecond matching.
4. **Splash Screen**: A dedicated component in React that triggers on every app mount.
5. **UI Visibility**: Audit and fix React component logic to ensure all buttons (e.g., Scan, Rule Management) are correctly rendered.

## Proposed Steps
1. **Provision Firebase**: Initialize Firestore and Auth via AI Studio tools.
2. **Python Backend Setup**:
   - Install `fastapi`, `uvicorn`, `google-cloud-firestore`.
   - Implement routes for `Rules`, `Scanned Items`, and `Logs`.
   - Integrate `FastKeywordMatcher` into the request lifecycle.
3. **Frontend Refactor**:
   - Replace existing Node-based API calls with Python-based API calls.
   - Add the `SplashScreen` component.
   - Implement real-time sync listeners for Firestore.
4. **Data Migration**: Move any existing local rules/logs to Firestore.
5. **Verification**: Ensure the server runs on port 3000 and passes all functional tests.
