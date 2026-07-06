# Technical Architecture Document (TAD)
## ZeroLag — Local-First Project Management Platform

**Version:** 1.0
**Target Audience:** Frontend Engineers, Full-Stack Engineers

---

## 1. Introduction

This Technical Architecture Document details the explicit technology choices, library dependencies, state management methodologies, and component structures of the ZeroLag codebase.

---

## 2. Technology Stack

### 2.1 Core Framework
- **React (18+)**: Component-based UI library.
- **Vite**: Ultra-fast build tool and development server.
- **TypeScript**: Strictly typed JavaScript to guarantee reliable data structures and component props.

### 2.2 Local Database Layer
- **RxDB (Reactive Database)**: Acts as the primary data store. It allows components to subscribe to queries so that any change in the database immediately re-renders the UI without manual state lifting.
- **Dexie.js**: The underlying storage adapter used by RxDB to interface with the browser's native IndexedDB.

### 2.3 State Management
- **Zustand**: A minimalistic, non-opinionated global state manager. It is used exclusively for *ephemeral UI state* (e.g., `selectedTaskId`, `isOffline`, `syncStatus`, `globalToastMessage`) and user preferences (`notificationsEnabled`).
- **RxDB Observables**: Used for *persistent application data* (e.g., Boards, Columns, Tasks). 

### 2.4 Styling & UI
- **TailwindCSS (v4)**: Utility-first CSS framework handling all visual styling.
- **Framer Motion**: powers the fluid spring animations and physics-based drag-and-drop mechanics.
- **Lucide-React**: The icon library used universally across the application.
- **dnd-kit**: A lightweight, modular drag-and-drop toolkit utilized in the Kanban board.
- **React-Markdown**: Used within the Task Details Panel to render GitHub-Flavored Markdown descriptions.

---

## 3. Database Schema Definitions (RxDB)

The database schema is defined in `src/db/schema.ts`. All collections use JSON Schema standard definitions.

### 3.1 Task Collection
```json
{
  "title": "task",
  "version": 0,
  "type": "object",
  "primaryKey": "id",
  "properties": {
    "id": { "type": "string", "maxLength": 100 },
    "columnId": { "type": "string" },
    "title": { "type": "string" },
    "description": { "type": "string" },
    "priority": { "type": "string", "default": "normal" },
    "labels": { "type": "array", "items": { "type": "string" } },
    "dueDate": { "type": "string" },
    "position": { "type": "number" },
    "attachments": { "type": "array", "items": { "type": "object" } },
    "updatedAt": { "type": "string" },
    "version": { "type": "number", "default": 1 },
    "deviceId": { "type": "string" }
  },
  "required": ["id", "columnId", "title", "position"]
}
```

### 3.2 Operations Ledger
The operations ledger acts as the intermediary syncing queue.
```json
{
  "title": "operation",
  "version": 0,
  "type": "object",
  "primaryKey": "id",
  "properties": {
    "id": { "type": "string", "maxLength": 100 },
    "type": { "type": "string", "enum": ["CREATE", "UPDATE", "DELETE"] },
    "entity": { "type": "string", "enum": ["BOARDS", "COLUMNS", "TASKS", "COMMENTS", "ACTIVITIES"] },
    "entityId": { "type": "string" },
    "boardId": { "type": "string" },
    "payload": { "type": "string" }, // JSON stringified entity data
    "timestamp": { "type": "string" },
    "status": { "type": "string", "default": "PENDING" }
  }
}
```

---

## 4. Component Architecture

### 4.1 Entry Point (`App.tsx`)
Initializes the `DatabaseProvider` and `SyncProvider` context. Contains the main routing logic (dashboard vs board view) and renders the global toast notifications.

### 4.2 The Sync Engine (`useSyncEngine.tsx`)
A massive background hook initialized high up in the tree. It manages:
- Polling for internet connectivity (`navigator.onLine`).
- Pushing `PENDING` operations from RxDB to Supabase.
- Subscribing to Supabase Realtime channels.
- Pumping incoming remote operations back into the local RxDB instance.
- Orchestrating audio chimes for remote edits.

### 4.3 Board View (`KanbanBoard.tsx`)
Subscribes to RxDB collections (`boards`, `columns`, `tasks`). Uses `@dnd-kit/core` `DndContext` wrapping the entire column grid. Handles optimistic UI updates natively because dragging a card simply updates the `position` and `columnId` in RxDB, which instantly triggers a re-render.

### 4.4 Task Details (`TaskDetailsPanel.tsx`)
A heavily animated side-panel powered by `framer-motion`. Renders `ReactMarkdown` and supports file attachments. File attachments are converted to Base64 strings and stored directly in the IndexedDB document before syncing.

---

## 5. Middleware & Interceptors

ZeroLag utilizes RxDB collection hooks (`postInsert`, `postSave`, `postRemove`) to capture every database mutation.

When a user modifies a task:
1. `db.tasks.patch()` is called.
2. The `postSave` middleware intercepts the action.
3. The middleware constructs an `operation` object representing the change.
4. The operation is appended to the `operations` table with a `PENDING` status.
5. The Sync Engine periodically sweeps the `operations` table for `PENDING` items to push to the cloud.
