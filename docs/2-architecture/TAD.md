# Technical Architecture Document (TAD)
## ZeroLag — Local-First Project Management Platform

**Version:** 1.0

---

## 1. Technology Stack

### 1.1 Core Framework
- **React (18+)**: Component-based UI library.
- **Vite**: Ultra-fast build tool and development server.
- **TypeScript**: Strictly typed JavaScript to guarantee reliable data structures and component props.

### 1.2 Local Database Layer
- **RxDB (Reactive Database)**: Acts as the primary data store. It allows components to subscribe to queries so that any change in the database immediately re-renders the UI without manual state lifting.
- **Dexie.js**: The underlying storage adapter used by RxDB to interface with the browser's native IndexedDB.

### 1.3 State Management
- **Zustand**: A minimalistic, non-opinionated global state manager. It is used exclusively for *ephemeral UI state* (e.g., `selectedTaskId`, `isOffline`, `syncStatus`).
- **RxDB Observables**: Used for *persistent application data* (e.g., Boards, Columns, Tasks). 

### 1.4 Backend API & Serverless
- **Vercel Serverless Functions**: Located in the `api/` directory, these backend routes securely proxy requests to third-party services (like Google Gemini) without exposing sensitive API keys to the client payload.

### 1.5 Styling & UI
- **TailwindCSS (v4)**: Utility-first CSS framework handling all visual styling, delivering a Premium Glassmorphic aesthetic.
- **Framer Motion**: powers the fluid spring animations and physics-based drag-and-drop mechanics.
- **Lucide-React**: The icon library used universally across the application.
- **dnd-kit**: A lightweight, modular drag-and-drop toolkit utilized in the Kanban board.
- **React-Markdown**: Used within the Task Details Panel to render GitHub-Flavored Markdown descriptions.

---

## 2. Component Architecture

### 2.1 Entry Point (`App.tsx`)
Initializes the `DatabaseProvider` and `SyncProvider` context. Contains the main routing logic and renders global toast notifications.

### 2.2 Board View (`KanbanBoard.tsx` & `BoardView.tsx`)
Subscribes to RxDB collections (`boards`, `columns`, `tasks`). Uses `@dnd-kit/core` `DndContext` wrapping the entire column grid. Handles optimistic UI updates natively. Supports **Custom Phase Columns** allowing users to dynamically add, rename, reorder, and safely delete custom project phases.

### 2.3 Task Details (`TaskDetailsPanel.tsx`)
A heavily animated side-panel powered by `framer-motion`. Renders `ReactMarkdown` and supports file attachments, task assignments, and label management. File attachments are converted to Base64 strings and stored directly in the IndexedDB document before syncing.

### 2.4 Serverless AI Integration (`api/parse-timetable.ts`)
A secure Vercel Serverless Function that receives multi-part form data containing timetable images from the client, injects the server-side `GEMINI_API_KEY`, and interfaces with Google's generative AI to return structured Kanban board data.

---

## 3. Middleware & Interceptors
ZeroLag utilizes RxDB collection hooks (`postInsert`, `postSave`, `postRemove`) to capture every database mutation.

When a user modifies a task:
1. `db.tasks.patch()` is called.
2. The `postSave` middleware intercepts the action.
3. The middleware constructs an `operation` object representing the change.
4. The operation is appended to the `operations` table with a `PENDING` status.
5. The Sync Engine periodically sweeps the `operations` table for `PENDING` items to push to the cloud.
