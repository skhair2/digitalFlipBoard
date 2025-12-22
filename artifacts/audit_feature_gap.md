# Technical Audit: Feature Gap Analysis

This document identifies the discrepancies between the frontend design and the backend/worker implementation in the Digital FlipBoard project.

## 1. Core Infrastructure Gaps

### A. Message Scheduling (Critical)
- **Frontend**: `Scheduler.jsx` and `boardStore.js` are fully implemented. They allow users to pick a time and save a message to the `scheduled_messages` table in Supabase.
- **Backend/Worker**: The `worker` package currently only handles **session cleanup** (Redis expiration). There is no logic to poll or listen for upcoming schedules in Supabase and emit them via Socket.io.
- **Impact**: The "Schedule" feature in the UI is currently a "dead end"—messages are saved but never displayed.

### B. Animation Engine
- **Frontend**: `AnimationPicker.jsx` offers "Classic Flip", "Soft Fade", "Slide Up", and "Typewriter".
- **Display**: `DigitalFlipBoardGrid.jsx` primarily handles `flip` and `fade`.
- **Impact**: Selecting "Slide Up" or "Typewriter" in the controller may result in a fallback to "flip" or no animation at all.

### C. Custom Message Library
- **Frontend**: `PreloadedMessages.jsx` uses a hardcoded list. The UI mentions "Sign in to save custom," but the logic to save a message from the `MessageInput` to a `user_messages` table is missing.
- **Impact**: Users cannot build their own library of frequently used phrases.

## 2. Feature Gaps (vs. Design Intent)

### A. Automated Integrations ("Channels")
- **Status**: Completely missing from both frontend and backend.
- **Design Intent**: The project philosophy (Mission.md) suggests a "Vestaboard-like" experience, which necessitates automated data feeds.

### B. Role-Based Access Control (RBAC)
- **Frontend**: `RoleManagement.jsx` exists in the file tree.
- **Backend**: The API uses a simple `verifyToken` middleware but doesn't enforce granular "Editor" vs. "Viewer" roles for specific boards.

### C. Mobile Experience
- **Status**: The web app is responsive, but lacks a `manifest.json` and Service Worker for PWA (Progressive Web App) installation.
- **Impact**: No "Add to Home Screen" capability or push notifications for session alerts.

## 3. Recommended Technical Fixes

1.  **Worker Update**: Implement a `ScheduleProcessor` in `packages/worker` that runs every minute, checks for due messages in Supabase, and triggers the API to broadcast them.
2.  **Animation Parity**: Update `DigitalFlipBoardGrid.jsx` to support the full suite of animations defined in the `AnimationPicker`.
3.  **PWA Manifest**: Add a web manifest and icons to `packages/web/public` to enable mobile installation.
