# Setup & Deployment

This guide covers how to set up ZeroLag for local development and how to deploy it to production.

---

## Local Development

### 1. Prerequisites
- **Node.js** (v18+)
- **Clerk Account** (Create a project at clerk.com)
- **Supabase Account** (Create a project at supabase.com)

### 2. Environment Variables
Create a `.env` or `.env.local` file in the root directory:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 3. Supabase Configuration
Execute the following SQL in your Supabase SQL Editor:
1. **Schema**: Create the `boards`, `operations`, and `board_access` tables.
2. **RLS**: Apply the Row-Level Security policies (see `SECURITY.md`).

### 4. Clerk Configuration
1. Navigate to **Clerk Dashboard > JWT Templates**.
2. Create a new template named `supabase`.
3. Set **Signing algorithm** to `HS256`.
4. Enable **Custom signing key**.
5. Paste your Supabase **Legacy JWT Secret** (found in Supabase > Settings > API > JWT Settings).

### 5. Running the App
```bash
npm install
npm run dev
```

---

## Production Deployment

Because ZeroLag is a 100% static React application (Serverless / Local-first architecture), it can be hosted for free on edge networks.

### Deploying to Vercel
1. Push your code to a GitHub repository.
2. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository.
4. In the **Environment Variables** section, add your `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`.
5. Click **Deploy**.

Vercel will automatically run `npm run build` (Vite) and deploy the static assets to their global edge CDN.
