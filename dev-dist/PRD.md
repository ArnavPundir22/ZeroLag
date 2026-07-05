# Product Requirements Document (PRD)

# ZeroLag — Local-First Project Management Platform

**Version:** 1.0
**Owner:** You
**Status:** Draft
**Target Audience:** Developers, Students, Startups, Small Teams

---

# 1. Product Overview

## Vision

Build a project management platform that feels as responsive as a native desktop application while running entirely inside the browser.

Unlike traditional SaaS apps that depend on network requests for every interaction, ZeroLag performs every action locally first and synchronizes changes with the cloud only when connectivity is available.

The result is a productivity application with:

* Zero loading spinners
* Instant interactions
* Offline-first workflow
* Conflict-aware synchronization
* Seamless multi-device experience

---

# 2. Problem Statement

Most productivity apps still rely heavily on server round trips.

Users experience:

* Loading indicators
* Network latency
* Failed requests
* Poor offline support
* Lost work during unstable internet

Developers also struggle implementing:

* Offline storage
* Optimistic UI
* Sync queues
* Conflict resolution

ZeroLag solves all of these through a Local-First architecture.

---

# 3. Goals

### Primary Goals

* Every interaction completes instantly
* Entire application usable offline
* Automatic background synchronization
* Never lose user changes
* Native-app feel inside browser

### Secondary Goals

* Cross-device syncing
* Collaborative editing
* Fast startup (<100ms)
* Installable as a PWA

---

# 4. Non Goals (V1)

No:

* AI task generation
* Calendar integration
* Gantt Charts
* Time tracking
* Video meetings
* Notifications
* Enterprise permissions

Those belong in future releases.

---

# 5. Target Users

## Persona 1 — Student

Uses Kanban board for:

* Assignments
* Exams
* Personal goals

Pain Point:

Poor internet in college.

Needs:

Offline functionality.

---

## Persona 2 — Developer

Tracks

* Features
* Bugs
* Pull Requests

Needs

Fast interactions similar to Linear.

---

## Persona 3 — Startup Founder

Uses

* Roadmaps
* Sprint planning
* Product ideas

Needs

Speed and reliability.

---

# 6. Core Value Proposition

> "Your productivity should never depend on WiFi."

---

# 7. User Stories

### Authentication

As a user

* I can create an account
* I can login
* My data syncs across devices

---

### Workspace

As a user

I can

* Create workspace
* Rename workspace
* Delete workspace

---

### Boards

I can

* Create boards
* Delete boards
* Archive boards

---

### Columns

I can

* Add columns
* Rename columns
* Reorder columns

---

### Tasks

I can

* Create tasks
* Edit tasks
* Delete tasks
* Assign labels
* Add due dates
* Add description

---

### Drag & Drop

I can

Move tasks between columns instantly.

No loading spinner should ever appear.

---

### Offline

When internet disconnects

I can still

* Add tasks
* Edit tasks
* Delete tasks
* Move tasks

Everything works normally.

---

### Sync

When internet returns

Changes automatically synchronize.

No user action required.

---

### Conflict Resolution

If two devices edit same task

System automatically resolves conflict.

(V1: Last Write Wins)

---

# 8. Functional Requirements

## Authentication

Features

* Email login
* Google OAuth
* JWT Authentication
* Session persistence

---

## Dashboard

Displays

* Recent Boards
* Favorites
* Workspaces

---

## Board

Displays

Kanban columns.

Supports

* Infinite scrolling
* Drag Drop
* Virtualization

---

## Task Card

Contains

* Title
* Description
* Labels
* Priority
* Due Date
* Created Date
* Updated Date

---

## Task Details

Supports

* Markdown
* Checklists
* Comments (future)
* Attachments (future)

---

## Search

Instant local search.

Should work offline.

---

## Filter

Filter by

* Priority
* Labels
* Due Date

Offline supported.

---

## Sync Engine

Automatically

* Detects connectivity
* Uploads queued operations
* Downloads remote changes
* Merges data

---

## Background Sync

Uses Service Workers.

Runs even after tab closes (where supported).

---

## Installable

Supports

PWA installation.

---

# 9. Non Functional Requirements

Performance

* First load <2 seconds
* App load after install <300ms
* Local interactions <16ms

Availability

Offline capable

99% features work offline.

Reliability

No data loss.

Scalability

Support

* 50 workspaces
* 100 boards
* 50,000 tasks locally

---

# 10. Local-First Architecture

```
            User

              │

              ▼

         React UI

              │

              ▼

      Local Database
      (IndexedDB)

              │

      Instant Response

              │

      Sync Queue

              │

              ▼

      Service Worker

              │

              ▼

      Sync Engine

              │

              ▼

       Cloud Server

              │

              ▼

       Other Devices
```

---

# 11. Local Database

Technology

IndexedDB

Recommended Wrapper

* RxDB

Collections

```
users

workspaces

boards

columns

tasks

operations

settings
```

---

# 12. Sync Strategy

Every modification creates an operation.

Example

```
CREATE_TASK

UPDATE_TASK

DELETE_TASK

MOVE_TASK
```

Instead of uploading entire database

Only operations are synced.

Example Queue

```
1 Create Task

2 Move Task

3 Rename Task

4 Delete Task
```

Background worker uploads queue.

---

# 13. Conflict Resolution

Version 1

Last Write Wins

Every document contains

```
updatedAt

deviceId

version
```

Future

CRDT implementation.

---

# 14. Optimistic UI Flow

```
Click Create Task

↓

Save locally

↓

Render instantly

↓

Add to Sync Queue

↓

Background Upload

↓

Server Confirms

↓

Remove Queue Item
```

User never waits.

---

# 15. Offline Flow

Internet Lost

↓

App detects offline

↓

Continue using normally

↓

Changes stored locally

↓

Reconnect

↓

Background Sync

↓

Server Updated

↓

Other devices updated

---

# 16. Edge Cases

### Duplicate edits

Resolve using timestamps.

---

### Browser closed

Queue survives using IndexedDB.

---

### Failed sync

Retry with exponential backoff.

---

### Server unavailable

Keep queue.

Retry later.

---

### Large attachments

Skip sync.

Upload once online.

---

# 17. Tech Stack

## Frontend

* React
* TypeScript
* Tailwind CSS
* Vite

---

## State

* Zustand

---

## Database

* IndexedDB
* RxDB

---

## Offline

* Service Workers
* Background Sync API

---

## Drag Drop

* dnd-kit

---

## Backend

* Node.js
* Express

---

## Database

* PostgreSQL

---

## ORM

* Prisma

---

## Authentication

* Better Auth / Clerk / Auth.js

---

## Deployment

Frontend

* Vercel

Backend

* Railway / Render

Database

* Neon PostgreSQL

---

# 18. API Endpoints

```
POST /login

POST /register

GET /sync

POST /sync

GET /boards

GET /tasks

POST /tasks

PATCH /tasks/:id

DELETE /tasks/:id
```

---

# 19. Database Schema

## Board

```
id

workspaceId

title

createdAt

updatedAt
```

---

## Column

```
id

boardId

title

position
```

---

## Task

```
id

columnId

title

description

priority

labels

dueDate

position

updatedAt

version

deviceId
```

---

## Operations

```
id

type

entity

entityId

payload

timestamp

status
```

---

# 20. Success Metrics

Performance

* Board loads instantly
* Task creation <20ms
* Drag latency <16ms

Offline

* 100% CRUD available offline

Sync

* 99% successful syncs

UX

* No loading spinner for local operations

---

# 21. Future Roadmap

### V1

* Local-first architecture
* Kanban
* Offline
* Background Sync

---

### V2

* Real-time collaboration
* Comments
* File attachments
* Activity timeline
* Keyboard shortcuts
* Dark mode

---

### V3

* CRDT synchronization
* AI sprint planning
* AI summaries
* Voice commands
* Calendar integration
* Desktop app

---

# 22. Risks & Mitigations

| Risk                                           | Impact | Mitigation                                                              |
| ---------------------------------------------- | ------ | ----------------------------------------------------------------------- |
| IndexedDB storage quota exceeded               | High   | Monitor usage, compress data, purge caches, warn users                  |
| Background Sync API unsupported (e.g., Safari) | High   | Fallback to foreground sync on app focus or reconnect                   |
| Conflict resolution loses updates              | Medium | Start with Last Write Wins, design data model to migrate to CRDTs later |
| Large offline datasets slow queries            | Medium | Use indexes, pagination, virtualization, and lazy loading               |
| Multiple tabs editing the same data            | Medium | Coordinate with BroadcastChannel or Web Locks API                       |
| Sync queue corruption                          | High   | Persist queue atomically, include retries and idempotent operation IDs  |

---

# 23. What Makes ZeroLag Stand Out

Many Kanban clones demonstrate UI components. ZeroLag's differentiator is its architecture. The project showcases advanced frontend engineering concepts that are increasingly valuable in modern web applications:

* **Local-first data model** rather than server-first requests.
* **Optimistic updates** for every user action.
* **Operation-based synchronization** instead of full database syncing.
* **Offline-first experience** with automatic recovery.
* **Background synchronization** using Service Workers.
* **Conflict-aware data model** designed to evolve toward CRDTs.
* **PWA capabilities** for an installable, native-like experience.

These architectural decisions are the primary value of the project and make it a strong portfolio piece for demonstrating expertise beyond typical React CRUD applications.
