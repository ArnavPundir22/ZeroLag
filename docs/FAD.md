# Functional Architecture Document (FAD)
## ZeroLag — Local-First Project Management Platform

**Version:** 1.0
**Target Audience:** Product Managers, UI/UX Designers, Frontend Developers, QA Engineers

---

## 1. Executive Summary

ZeroLag is a local-first project management platform designed to eliminate loading spinners and network latency. The application prioritizes immediate user feedback by persisting all interactions to a local database (IndexedDB) first, and synchronizing with a remote backend (Supabase) entirely in the background.

This document outlines the core functional components, user roles, user journeys, and key capabilities of the system without delving into code-level implementation details.

---

## 2. User Roles & Personas

ZeroLag currently operates on a flat authorization model where users manage their own isolated data, but can collaborate on shared boards.

### 2.1 The Authenticated User
- **Capabilities**: Can create workspaces, boards, columns, and tasks. Can configure app settings (Theme, Notifications).
- **Authentication Method**: Email/Password, OAuth (Google/GitHub) via Clerk.
- **Offline Capability**: Can perform 99% of read/write operations without an internet connection.

### 2.2 The Collaborator
- **Capabilities**: A user who receives a shared link or invite to a specific workspace/board.
- **Real-Time Interaction**: When viewing a shared board, they receive real-time updates via WebSockets when the author makes changes.
- **Constraints**: Subject to Row Level Security (RLS) policies defining read/write permissions on the shared entity.

---

## 3. Core Functional Modules

The application is functionally divided into several core domains.

### 3.1 Authentication & Onboarding
- **Sign Up / Sign In**: Managed entirely by Clerk. Users authenticate via a dedicated Auth portal.
- **Session Management**: JWT tokens are issued and stored securely. The application handles token refreshing automatically during long sessions.
- **Offline Boot**: If the user has authenticated previously and opens the app offline, the app boots instantly using locally cached data.

### 3.2 Workspace & Board Management
- **Dashboard**: The central hub displaying all accessible projects/boards.
- **Board Lifecycle**: Users can create, rename, and delete Kanban boards.
- **Visual Identity**: Boards inherit a visually distinct, premium "Lumina" design system characterized by glassmorphism, deep dark themes, and electric indigo accents.

### 3.3 Kanban & Task Execution
- **Column Management**: Users can create vertical columns (e.g., Todo, In Progress, Done) to represent workflow states.
- **Task Lifecycle**: Users can create tasks containing titles, markdown descriptions, labels, priorities, and due dates.
- **Drag & Drop**: Users can visually drag tasks between columns. This interaction resolves *instantly* on the UI, regardless of network conditions.

### 3.4 The Inspector (Task Details Panel)
- **Rich Editing**: A right-side panel that slides over the board for deep task editing.
- **Metadata Management**: Select priority (Urgent, High, Normal, Low), assign Story Points, and attach custom labels.
- **Markdown Support**: The description field supports full GitHub-Flavored Markdown (GFM) for structured documentation.
- **Activity Stream & Comments**: Users can view an audit log of changes and communicate with collaborators via chat-style comments.

---

## 4. Key Workflows & User Journeys

### 4.1 The Offline-First Creation Flow
1. User clicks "Add Task".
2. UI instantly renders the new task card in the column.
3. System saves the task to the local database (RxDB).
4. System queues a `CREATE` operation.
5. (Background) System attempts to push the operation to the cloud. If offline, the queue halts safely. User is completely unaware of network state.

### 4.2 The Real-Time Collaboration Flow
1. User A moves a task from "Todo" to "Done".
2. Operation is instantly saved locally and synced to the cloud.
3. Cloud broadcasts the operation via WebSocket.
4. User B's application receives the broadcast.
5. User B's application verifies the operation is remote, triggers an Audio Chime, displays a Global Toast Notification, and updates the UI instantly.

### 4.3 The App Installation Flow (PWA)
1. User navigates to the ZeroLag URL.
2. User opens the Settings Modal and clicks "Install App".
3. Browser triggers the native PWA installation prompt.
4. ZeroLag is added to the user's home screen/dock, capable of booting instantly without a browser shell.

---

## 5. Functional Constraints & Limitations (V1)
- **Attachment Size**: File uploads are restricted to a maximum of 50MB per file.
- **Conflict Resolution**: The system currently employs a "Last-Write-Wins" (LWW) resolution strategy for concurrent edits on the same task.
- **History**: The operation ledger acts as an audit trail, but full point-in-time document restoration is not supported in the UI for V1.
