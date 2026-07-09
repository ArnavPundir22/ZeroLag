# Aurameet Integration Architecture

**ZeroLag** integrates seamlessly with the **BaatChit (Aurameet)** video conferencing platform to provide 1-click ephemeral meeting rooms natively within project boards.

## 1. Core Concept & Ephemerality
Aurameet operates on a zero-log, Redis-backed ephemeral architecture. Rooms are designed to self-destruct as soon as the last participant leaves the call, or after 1 hour of inactivity. 

To ensure ZeroLag users do not have to constantly copy-paste new meeting codes every time they want to huddle, we implemented a **Deterministic Room Code Strategy**.

## 2. Deterministic Room Code Strategy
Instead of relying on Aurameet to generate random 6-character room codes, ZeroLag dictates the room code based on the current Project Board ID.

```javascript
// ZeroLag dictates the code using the Board ID
const roomCode = currentBoardId.substring(0, 6).toUpperCase();
```

When a user clicks "Meet" in ZeroLag:
1. ZeroLag sends a `create` request to the Aurameet server with the deterministic `room_code`.
2. **If the room does not exist** (e.g., the meeting died overnight), Aurameet instantly provisions a new Redis room using that specific code.
3. **If the room already exists** (e.g., a colleague is already in the call), Aurameet gracefully accepts the request, extends the room's Time-To-Live (TTL), and drops the user directly into the active session.

## 3. PWA Compatibility & The `GET` Fix

### The Problem with `POST` in PWAs
Initially, the integration utilized a hidden DOM form to `POST` the creation payload to Aurameet with `target="_blank"`. 

While this works flawlessly in standard desktop browsers, **Progressive Web Apps (PWAs)** running in standalone mode (especially on iOS Safari and Android Chrome) often strip `POST` bodies when opening external links for security and isolation reasons. This resulted in the PWA sending an empty `GET /` request, dumping the user onto the Aurameet homepage instead of the video room.

### The `GET /meet` Solution
To resolve this cross-origin PWA limitation, we shifted the paradigm from a hidden `POST` to a parameterized `GET` request.

1. **BaatChit Backend:** Exposed a new `GET /meet` endpoint that extracts `action`, `room_code`, `room_name`, and `username` from `req.query` instead of `req.body`.
2. **ZeroLag Frontend:** Constructs a `URLSearchParams` string and utilizes `window.open()` to launch the room.

```typescript
// ZeroLag implementation for perfect PWA support
const baseUrl = 'https://baatcheet-88e9.onrender.com/meet';
const params = new URLSearchParams({
  action: 'create',
  room_code: currentBoardId.substring(0, 6).toUpperCase(),
  room_name: boardTitle,
  username: user?.fullName || 'ZeroLag User'
});

window.open(`${baseUrl}?${params.toString()}`, '_blank');
```

This ensures that regardless of the device—whether a desktop browser or an installed iOS PWA—the data is safely transmitted in the URL, resulting in a flawless 1-click meeting experience.
