# System Architecture

ZeroLag is built on a modern **Local-First** (offline-first) architecture. This approach flips traditional web development on its head: instead of waiting for a remote server to process requests and update the UI, the application reads and writes exclusively to a local database. 

Background sync processes handle eventual consistency with the cloud.

## Core Pillars

1. **Immediate Responsiveness**: All read/write operations hit the local database (RxDB), resulting in 0ms latency for the user.
2. **Offline Capable**: Because the application doesn't strictly depend on the network for core functionality, users can work entirely offline.
3. **Eventual Consistency**: Changes made locally are queued and pushed to the remote server when the network is available.
4. **Real-time Collaboration**: The remote server acts as a message broker, broadcasting changes to all connected clients.

---

## Data Flow Diagram

1. **User Action**: The user creates a task.
2. **Local Mutation**: The task is saved directly to RxDB (IndexedDB). UI updates instantly.
3. **Operation Queue**: An `operation` record (e.g. `type: CREATE`, `entity: TASK`) is written to RxDB with a status of `PENDING`.
4. **Sync Engine**: The `useSyncEngine` hook detects pending operations and pushes them to Supabase via REST (`.insert()`).
5. **Real-time Broadcast**: Supabase Realtime broadcasts the new operation over WebSockets.
6. **Remote Clients**: Other connected clients receive the WebSocket payload and apply the operation to their local RxDB instances.

---

## Database Technologies

### 1. RxDB (Local Database)
RxDB (Reactive Database) sits on top of Dexie (IndexedDB) in the browser.
- **Reactive Queries**: UI components subscribe directly to database queries. When data changes (locally or remotely), the UI re-renders automatically without complex state management.
- **Event Sourcing**: We do not overwrite rows remotely. Instead, we insert `operations` which represent state transitions.

### 2. Supabase (Remote Database)
Supabase acts as the centralized synchronization hub.
- **PostgreSQL**: Stores the canonical log of all operations and the `board_access` mapping.
- **Supabase Realtime**: Provides low-latency WebSocket channels to broadcast PostgreSQL row changes to clients.

## Conflict Resolution

In a distributed, offline-first system, conflicts are inevitable (e.g. two users edit the same task while offline).
ZeroLag handles this via **Last-Writer-Wins (LWW)** combined with an **Event-Sourced** payload queue.
Because every change is an immutable "Operation" stamped with a timestamp, clients process incoming operations chronologically. If an incoming remote operation is newer than the local state, it overwrites it.
