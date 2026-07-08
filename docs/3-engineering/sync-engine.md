# Sync Engine Architecture

The sync engine (`useSyncEngine.tsx`) is the heart of ZeroLag's offline-first capabilities. It operates as a bidirectional gateway between the RxDB local storage and the Supabase cloud.

---

## 1. The Push Cycle (Local -> Cloud)
When the user is online, the sync engine executes on a polling interval.

```mermaid
graph TD
    A[Timer Tick / Mutation Event] --> B{Is Network Online?}
    B -- No --> C[Sleep]
    B -- Yes --> D[Query Local PENDING operations]
    
    D --> E{Are there operations?}
    E -- No --> C
    E -- Yes --> F[Inject Clerk `_authorName`]
    
    F --> G[Save UUIDs to local ledger `zerolag_local_ops`]
    G --> H[POST to Supabase /operations]
    
    H -- Success (HTTP 201) --> I[Delete PENDING operations locally]
    H -- Failure (HTTP 4xx/5xx) --> J{Is it a 403 Forbidden?}
    
    J -- Yes --> K[Mark operation as FAILED to unblock queue]
    J -- No --> L[Keep PENDING, retry next tick]
```

---

## 2. The Pull Cycle & Real-Time Sync (Cloud -> Local)

ZeroLag uses WebSockets to receive remote changes instantly.

```mermaid
sequenceDiagram
    participant Supabase as Supabase Cloud
    participant Engine as Sync Engine
    participant Ledger as Local Ledger
    participant RxDB as Local Database
    participant UI as React UI

    Supabase->>Engine: WebSocket Event (New Operation)
    Engine->>Ledger: Check if Operation ID is in `zerolag_local_ops`
    
    alt isLocal == true
        Ledger-->>Engine: Authored by us
        Engine->>Engine: Silently discard event (already applied)
    else isLocal == false
        Ledger-->>Engine: Authored remotely
        Engine->>Engine: Strip `_authorName` payload
        Engine->>RxDB: Execute INSERT / PATCH / REMOVE
        RxDB-->>UI: Emits observable, triggers UI re-render
        Engine->>UI: Trigger Audio Chime & Toast Notification
    end
```

---

## 3. Conflict Resolution
Conflicts occur when two users modify the same entity simultaneously while offline, and both attempt to sync when they regain connectivity.

### Last-Write-Wins (LWW)
ZeroLag currently utilizes a timestamp-based LWW resolution strategy.
- Every `patch` or `insert` command executed by `handleRemoteOperation` operates strictly on the entity ID.
- Since the Sync Engine processes operations sequentially based on the `timestamp` they were recorded, the operation with the latest timestamp is applied last, effectively overwriting older, conflicting changes.
