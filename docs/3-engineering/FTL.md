# Feature Technical Logic (FTL)
## ZeroLag — Local-First Project Management Platform

**Version:** 1.0

---

## 1. Introduction

This document details the precise algorithmic flows that govern the most complex features of ZeroLag. By understanding these flows, engineers can debug synchronization races, resolve conflicts, and extend the local-first engine.

*Note: For detailed flowcharts on the Sync Engine and AI Import, see their respective sub-documents.*

---

## 2. Feature: The Audio-Visual Notification System

If a remote operation arrives and `isLocal == false` (the user did not author the change), and the user has notifications enabled:

1. **Audio Engine**: The app generates an 800Hz-1200Hz sine wave using the `window.AudioContext`.
2. **Throttle**: It checks a `lastNotificationTime` variable. If a sound played within the last 2000ms, it skips the audio to prevent overlapping audio spam.
3. **Toast Construction**: It extracts the `_authorName` and constructs a dynamic message (e.g., *"Jane Doe added a new task."*).
4. **UI Trigger**: It dispatches the message to Zustand (`setGlobalToastMessage`), which triggers a sliding notification in the top right of the viewport.

---

## 3. Feature: The Application Phase (Optimistic UI updates)

When `handleRemoteOperation()` intercepts a remote change, it strips the `_authorName` out of the incoming payload to prevent database pollution.
It executes an RxDB `insert`, `patch`, or `remove` based on the operation type.
Because the React UI components are subscribed directly to RxDB collections using `useRxData()`, the UI components magically re-render themselves the millisecond the local database is updated. No complex state lifting or `useEffect` polling is required.
