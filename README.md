# ⚡ ZeroLag

<p align="center">
  <em>A modern, blazing-fast, offline-first collaborative task management application.</em>
</p>

---

ZeroLag allows you to seamlessly manage your tasks, create project boards, and collaborate with your team in real-time. Built entirely around a **local-first** architecture, the application works completely offline and instantly syncs all changes the moment you reconnect to the internet—resulting in zero latency and zero loading spinners.

## 📚 Documentation

Welcome to the ZeroLag documentation hub. Please select a topic below to explore the internal workings, security model, and setup instructions.

- 🏗️ [**Architecture (ARCHITECTURE.md)**](./docs/ARCHITECTURE.md) - Learn about RxDB, Event Sourcing, and the Sync Engine.
- 🔒 [**Security (SECURITY.md)**](./docs/SECURITY.md) - Deep dive into Clerk JWTs and Supabase Row-Level Security.
- 🚀 [**Setup & Deployment (SETUP.md)**](./docs/SETUP.md) - Instructions for running locally and deploying to production.

---

## ✨ Quick Highlight: The Tech Stack

ZeroLag completely bypasses the traditional Node.js stateful backend in favor of modern serverless and edge technologies:

* **Frontend**: React 19 + TypeScript + Vite
* **UI & Animations**: TailwindCSS + Framer Motion + Lucide
* **Offline Database**: RxDB (IndexedDB)
* **Cloud Database & Realtime**: Supabase (PostgreSQL + WebSockets)
* **Authentication**: Clerk

---

## 🤝 Contributing
Contributions are welcome! Please ensure you have read the architecture documentation before submitting pull requests to ensure alignment with the offline-first sync engine logic.

## 📄 License
MIT License.
