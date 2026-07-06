# Feature Technical Logic (FTL)
## ZeroLag — Local-First Project Management Platform

**Version:** 1.0
**Target Audience:** Core Engineers, Open Source Contributors

---

## 1. Introduction

This document details the precise algorithmic flows that govern the most complex features of ZeroLag. By understanding these flows, engineers can debug synchronization races, resolve conflicts, and extend the local-first engine.

---

## 2. Feature: Offline-First Synchronization Engine

The sync engine operates as a bidirectional gateway between the RxDB local storage and the Supabase cloud.

### 2.1 The Push Cycle (Local -> Cloud)
When the user is online, the `syncOperations` function executes on a 2-second polling interval.

1. **Locking**: The engine sets `isSyncingRef.current = true` to prevent concurrent sync loops.
2. **Querying**: It queries IndexedDB for all operations where `status == 'PENDING'`.
3. **Packaging**: It maps the raw operations into a Supabase-compatible JSON array.
4. **Metadata Injection**: The payload is augmented with a hidden `_authorName` field containing the currently authenticated Clerk user's name. This ensures remote clients know who authored the change without polluting the local database.
5. **Ledgering**: It extracts the UUIDs of the new operations and appends them to a `localStorage` array (`zerolag_local_ops`) capped at 200 items. This ledger tracks operations *authored by this device*.
6. **Transmission**: The payload is sent to Supabase via `supabase.from('operations').insert()`.
7. **Cleanup**: Upon HTTP 201 (Created), the engine executes a bulk deletion (`bulkRemove`) on the local RxDB `operations` collection, effectively clearing the queue.

### 2.2 The Pull Cycle (Cloud -> Local Catch-up)
Triggered when the app is initialized or regains internet connectivity.

1. **Timestamping**: Reads `last_sync_timestamp` from `localStorage`. If empty, it defaults to catching up on all history for the user's boards.
2. **Fetching**: Calls Supabase for all operations `where timestamp > last_sync_timestamp` ordered sequentially.
3. **Replay**: Iterates through the operations array and passes them sequentially to `handleRemoteOperation()`.

---

## 3. Feature: Real-Time Collaboration & Notifications

ZeroLag provides real-time multi-player updates without requiring page reloads.

### 3.1 WebSocket Interception
1. The engine subscribes to `postgres_changes` on the Supabase `operations` table.
2. Every time *any* user inserts a row into `operations`, Supabase broadcasts the row to all connected clients.
3. The client receives the event payload containing the new row.

### 3.2 Self-Filtering Mechanism
When an event arrives, the client must decide if it authored the change (to avoid notifying itself or duplicate applying).
1. It compares the `op.id` against the `zerolag_local_ops` array stored in `localStorage`.
2. If `isLocal == true`, the event is silently ignored (because the client already applied it optimistically during step 2.1).
3. If `isLocal == false`, it proceeds to the Application Phase.

### 3.3 The Application Phase
1. `handleRemoteOperation()` strips the `_authorName` out of the incoming payload to prevent database pollution.
2. It executes an RxDB `insert`, `patch`, or `remove` based on the operation type.
3. RxDB's reactivity automatically updates the UI components.

### 3.4 The Audio-Visual Notification System
If `isLocal == false` and the user has notifications enabled:
1. **Audio Engine**: The app generates an 800Hz-1200Hz sine wave using the `window.AudioContext`.
2. **Throttle**: It checks a `lastNotificationTime` variable. If a sound played within the last 2000ms, it skips the audio to prevent overlapping audio spam.
3. **Toast Construction**: It extracts the `_authorName` and constructs a dynamic message (e.g., *"Jane Doe added a new task."*).
4. **UI Trigger**: It dispatches the message to Zustand (`setGlobalToastMessage`), which triggers a sliding notification in the top right of the viewport.

---

## 4. Feature: Conflict Resolution

Conflicts occur when two users modify the same entity simultaneously while offline, and both attempt to sync when they regain connectivity.

### 4.1 Last-Write-Wins (LWW)
ZeroLag currently utilizes a timestamp-based LWW resolution strategy.
- Every `patch` or `insert` command executed by `handleRemoteOperation` operates strictly on the entity ID.
- Since the Sync Engine processes operations sequentially based on the `timestamp` they were recorded, the operation with the latest timestamp is applied last, effectively overwriting older, conflicting changes.

### 4.2 Future Evolution (CRDT)
Future versions of ZeroLag will migrate from LWW to Conflict-Free Replicated Data Types (CRDTs). This will allow granular merging (e.g., User A changes the Title, User B changes the Priority; both survive) rather than entire document overrides.
