import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Extract Bearer Token
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header.' });
  }

  const token = authHeader.split(' ')[1];
  let actorUserId: string;

  try {
    // Decode Supabase-templated Clerk JWT payload (Supabase validates the signature upon DB queries)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    const payload = JSON.parse(jsonPayload);
    actorUserId = payload.sub;
  } catch (err: any) {
    return res.status(401).json({ error: 'Invalid Token Payload structure.', details: err.message });
  }

  const { boardId, title, body, url } = req.body || {};

  if (!boardId || !title || !body) {
    return res.status(400).json({ error: 'Missing required parameters: boardId, title, and body are required.' });
  }

  // 2. Initialize Supabase Client with User's JWT (verifies JWT signature inside Supabase)
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing Supabase URL or Anon Key.' });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  try {
    // 3. Get all collaborators on the board
    const { data: collaborators, error: collError } = await supabase
      .from('board_access')
      .select('user_id')
      .eq('board_id', boardId);

    if (collError) {
      console.error('[PUSH NOTIFY] Error fetching collaborators:', collError);
      return res.status(500).json({ error: 'Failed to fetch board collaborators.', details: collError });
    }

    if (!collaborators || collaborators.length === 0) {
      return res.status(200).json({ message: 'No collaborators found on this board.' });
    }

    // Filter out the actor (the user making the change)
    const otherUserIds = collaborators
      .map((c: any) => c.user_id)
      .filter((uid: string) => uid !== actorUserId);

    if (otherUserIds.length === 0) {
      return res.status(200).json({ message: 'No other collaborators to notify.' });
    }

    // 4. Fetch push subscriptions for other collaborators
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .in('user_id', otherUserIds);

    if (subError) {
      console.error('[PUSH NOTIFY] Error fetching subscriptions:', subError);
      return res.status(500).json({ error: 'Failed to fetch push subscriptions.', details: subError });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ message: 'No active push subscriptions for other collaborators.' });
    }

    // 5. Initialize web-push
    const publicVapidKey = process.env.VITE_WEB_PUSH_PUBLIC_KEY;
    const privateVapidKey = process.env.WEB_PUSH_PRIVATE_KEY;

    if (!publicVapidKey || !privateVapidKey) {
      return res.status(500).json({ error: 'Server configuration error: Missing VAPID Keys.' });
    }

    webpush.setVapidDetails(
      'mailto:support@zerolag.app',
      publicVapidKey,
      privateVapidKey
    );

    // 6. Send push notifications
    const payload = JSON.stringify({
      title,
      body,
      url: url || '/'
    });

    const sendPromises = subscriptions.map((subObj: any) => {
      return webpush.sendNotification(subObj.subscription, payload)
        .catch(err => {
          console.warn('[PUSH NOTIFY] Failed to send to subscription, it might have expired:', err.message);
        });
    });

    await Promise.all(sendPromises);

    return res.status(200).json({ message: `Successfully processed ${sendPromises.length} notification(s).` });
  } catch (error: any) {
    console.error('[PUSH NOTIFY] Unexpected error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred.', details: error.message });
  }
}
