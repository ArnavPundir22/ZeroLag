# ⚡ ZeroLag

<p align="center">
  <em>A modern, blazing-fast, offline-first collaborative task management application.</em>
</p>

---

ZeroLag allows you to seamlessly manage your tasks, create project boards, and collaborate with your team in real-time. Built entirely around a **local-first** architecture, the application works completely offline and instantly syncs all changes the moment you reconnect to the internet—resulting in zero latency and zero loading spinners.

## 🏗️ 1. Architecture Philosophy: Local-First

Traditional web applications follow a Client-Server model: the user clicks a button, a network request is sent to a backend, and the UI waits for a response (displaying a spinner) before updating. 

ZeroLag abandons this model for a **Local-First Architecture**. 
1. The primary database lives in the browser (IndexedDB).
2. All read/write operations execute against this local database with 0ms latency.
3. The UI updates instantly via reactive subscriptions.
4. A background **Sync Engine** propagates these local mutations to a central cloud server, which then broadcasts them to other connected devices.

---

## 🔄 2. The Sync Engine (`useSyncEngine.tsx`)

The Sync Engine is the heart of ZeroLag, ensuring that the local database remains synchronized with the remote PostgreSQL database (Supabase) and other active clients.

### 2.1 The Operation Queue
Instead of directly modifying remote rows (e.g., `UPDATE tasks SET title = 'x'`), ZeroLag uses **Event Sourcing**. Every mutation generates an `operation` record in the local database:

```json
{
  "id": "uuid-v4",
  "type": "UPDATE",
  "entity": "TASKS",
  "entityId": "task-123",
  "payload": { "title": "New Title" },
  "status": "PENDING",
  "timestamp": "2026-07-06T12:00:00.000Z"
}
```

### 2.2 Synchronization Loop
The sync engine operates continuously in the background:
1. **Local Observation**: It subscribes to the local `operations` collection: `db.operations.$.subscribe(...)`.
2. **Debouncing**: When a local operation is detected, a 1-second debounce timer (`syncTimeoutRef`) begins. This batches rapid changes (like typing a description or dragging tasks) into a single network request.
3. **Push to Remote**: The engine queries all operations where `status: 'PENDING'`. It filters out local metadata, resolves existing IDs to avoid unique constraint violations, and bulk-inserts them into the Supabase `operations` table.
4. **Cleanup**: Upon a successful remote insert, the pending operations are wiped from the local device to keep IndexedDB lean.

### 2.3 Real-Time Broadcasts (WebSockets)
ZeroLag utilizes Supabase Realtime to establish a continuous WebSocket connection. 
```typescript
supabase.channel('public:operations')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'operations' }, async (payload) => {
     await handleRemoteOperation(payload.new);
  }).subscribe();
```
When a remote client inserts a new operation into PostgreSQL, Supabase broadcasts it down this channel. The local client receives the operation, parses the payload, and applies the patch (`doc.patch(cleanData)`) directly to its local RxDB instance. Because the React UI is observing RxDB, it re-renders instantly.

### 2.4 Reconnection Bootstrap
When a user opens the app after being offline, they may have missed WebSocket events.
The app fetches all remote operations where `timestamp > last_sync_timestamp`. It replays these operations chronologically to "catch up" the local database state to the current global state before relying on WebSockets again.

---

## 🎨 3. UI & Drag-and-Drop Optimization

ZeroLag implements complex, nested drag-and-drop mechanics using `@dnd-kit`, specifically tailored for both desktop mice and mobile touch screens.

### 3.1 Sensor Configuration
To ensure mobile scrollability isn't blocked by draggable task cards, `Board.tsx` explicitly configures distance sensors:
```typescript
const sensors = useSensors(
  useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
  useSensor(TouchSensor, { activationConstraint: { distance: 5 } })
);
```
This forces the user to drag their finger at least 5 pixels before the task is "picked up", allowing normal vertical scrolling to continue uninterrupted.

### 3.2 Optimistic Drag Updates
When a task is dragged over another column, the UI updates optimistically *before* the drag ends.
- **`handleDragOver`**: Uses `@dnd-kit/sortable`'s `arrayMove` to visually snap the task into the new column instantly.
- **`handleDragEnd`**: Iterates through the newly ordered array and compares it to the local RxDB state. If a task's `columnId` or `position` index has changed, it issues a `patch` command to RxDB, which generates the sync operations automatically.

---

## 🗄️ 4. Local Database Schema (RxDB)

ZeroLag uses **RxDB** backed by Dexie. RxDB provides NoSQL-like collections with powerful indexing and reactive query capabilities.

### 4.1 Indexing Strategies
To keep drag-and-drop performant across hundreds of tasks, the `taskSchema` utilizes compound indexes:
```typescript
indexes: ['columnId', 'position', ['columnId', 'position']]
```
This allows the `Board` component to execute lightning-fast sorts: `db.tasks.find({ sort: [{ position: 'asc' }] })`.

### 4.2 Handling Controlled Form Inputs
A major challenge in real-time sync systems is form input tearing (e.g., user types a character, but the delayed database reactive loop overwrites the input field before the next character is typed).

ZeroLag resolves this in `TaskDetailsPanel.tsx` by decoupling local UI state from the RxDB reactive loop during focus:
```tsx
const [localTitle, setLocalTitle] = useState('');
const [isTitleFocused, setIsTitleFocused] = useState(false);

<textarea
  value={isTitleFocused ? localTitle : task.title}
  onFocus={() => { setIsTitleFocused(true); setLocalTitle(task.title); }}
  onBlur={() => setIsTitleFocused(false)}
  onChange={(e) => {
    setLocalTitle(e.target.value);
    updateField('title', e.target.value); // Syncs to DB in background
  }}
/>
```
This guarantees 60fps typing performance without losing data or cursor positioning, while still silently syncing characters to other clients.

---

## 🔒 5. Edge Authentication & Security

ZeroLag achieves total security without a custom Node.js server. 

### 5.1 Clerk JWT to Supabase Translation
1. The user signs in via Clerk's Edge Network.
2. The React client requests a specialized Supabase token: `await session.getToken({ template: 'supabase' })`.
3. This token embeds the Clerk user ID into the `sub` (subject) claim and is signed using the Supabase project's secure symmetric key.
4. The client uses this token to connect to Supabase:
   ```typescript
   const supabase = createClient(url, key, { accessToken: () => token });
   ```

### 5.2 Row-Level Security (RLS)
PostgreSQL executes queries contextually using the `auth.uid()` extracted from the JWT.
A mapping table (`board_access`) tracks which `user_id` belongs to which `board_id`.
```sql
CREATE POLICY "Users can view operations for their boards"
ON operations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM board_access 
    WHERE board_access.board_id = operations.board_id 
    AND board_access.user_id = auth.uid()::text
  )
);
```
If a malicious user attempts to intercept WebSockets or execute REST queries for a board they haven't joined, PostgreSQL blocks the request at the database engine level, returning 0 rows.

### 5.3 Link Sharing
Board IDs are cryptographically secure `UUIDv4` strings. If a user is given a Board ID by a peer, they enter it into the UI. The RLS policy explicitly permits `INSERT` statements into `board_access`, securely adding the user to the workspace.

---

## 🌐 6. Progressive Web App (PWA) Delivery

ZeroLag is built to look and feel like a native application. 
- **vite-plugin-pwa**: Configures the Service Worker to cache JS/CSS bundles and assets for immediate offline loading.
- **Manifest**: Defines `theme_color: '#0e0e10'` to blend the mobile browser address bar directly into the app's dark theme, ensuring edge-to-edge UI immersiveness.
- **Mobile UI**: Incorporates bottom-sheet modal interactions (`TaskDetailsPanel.tsx`), rounded touch targets, and dynamic viewport height calculations to prevent the mobile virtual keyboard from breaking the layout.

---

## 🤝 Contributing
Contributions are welcome! Please ensure you have read the architecture documentation above before submitting pull requests to ensure alignment with the offline-first sync engine logic.

## 📄 License
MIT License.
