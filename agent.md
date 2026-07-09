# ZeroLag AI Agent Instructions

Welcome to the **ZeroLag** codebase! You are an AI coding assistant working on this project. Please strictly follow these guidelines when writing code, refactoring, or providing technical solutions.

## 1. Project Overview & Philosophy
**ZeroLag** is a local-first, offline-first project management platform designed to eliminate loading spinners and network latency.
- **Core Principle:** Immediate user feedback. All interactions must be persisted to a local database first and synchronized with the remote backend entirely in the background.
- **Visual Identity:** "Lumina" design system. Prioritize glassmorphism, deep dark themes, and electric indigo accents for a premium look and feel.
- **Real-Time Collaboration:** When users are online, interactions should broadcast via WebSockets and update the UI instantly for other clients, along with appropriate notifications (e.g., Audio Chimes, Global Toasts).

## 2. Tech Stack
- **Frontend Framework:** React 19 + Vite
- **Language:** TypeScript (Strict mode enabled)
- **Styling:** Tailwind CSS v4 + Framer Motion (for animations)
- **Authentication:** Clerk (`@clerk/react`)
- **State Management:** Zustand
- **Local Database:** RxDB / Dexie
- **Remote Database/Backend:** Supabase
- **Real-time Engine:** Socket.io-client
- **Drag & Drop:** `@dnd-kit/core` & `@dnd-kit/sortable`
- **Routing:** React Router v7 (`react-router-dom`)

## 3. Directory Structure & Architecture
The project follows a modular, feature-sliced design pattern located in `/src`:
- `/src/components` - Reusable UI components (buttons, inputs, modals).
- `/src/features` - Feature-specific modules (e.g., boards, tasks). Keep business logic grouped by feature.
- `/src/routes` - Application pages and routing configuration.
- `/src/store` - Global state management using Zustand.
- `/src/db` - Local-first database schemas and setup (RxDB/Dexie).
- `/src/hooks` - Custom React hooks.
- `/src/utils` - Helper functions and constants.
- `/src/providers` - Context providers (Clerk, Theme, DB, etc.).

## 4. Coding Standards & Best Practices
### TypeScript & React
- **NO `any`:** Always define proper TypeScript interfaces or types for props, state, and API responses.
- **Functional Components:** Always use functional components with React Hooks. Do not use class components.
- **Early Returns:** Use early returns to reduce nesting and improve readability.
- **Destructuring:** Destructure props and state for cleaner code.

### Styling
- **Tailwind Native:** Use Tailwind utility classes directly. Avoid custom CSS unless absolutely necessary (if so, use `index.css` or `App.css`).
- **Animations:** Use `framer-motion` for complex transitions and micro-interactions to maintain the premium feel.

### Offline-First Data Flow
- **Do not wait for network requests** to update the UI (Optimistic UI updates).
- **Read/Write Flow:** Component UI -> Zustand/Local DB -> UI Updates instantly -> Background Sync to Supabase.

### Code Hygiene
- **Optimized & Concise Code:** Do not write useless or extra code. Always strive for the most optimal, concise, and direct approach to solve a problem without over-engineering or long-winded solutions.
- Do not remove existing comments unless explicitly requested.
- Remove unnecessary `console.log` statements before committing code.
- Ensure proper error handling, especially for network/sync operations, failing gracefully without disrupting the user experience.

## 5. Typical Workflows
- **Creating a Feature:** Add the UI component to `src/features/[feature-name]`, handle local state via Zustand, persist via `src/db`, and let the sync engine push to Supabase.
- **Adding a Route:** Define the page in `src/routes` and ensure it is properly linked in the Sidebar navigation if applicable.
