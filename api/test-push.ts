import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Extract Bearer Token
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token.' });
  }

  const token = authHeader.split(' ')[1];
  let userId: string;

  try {
    // Decode Supabase-templated Clerk JWT payload (Supabase validates the signature upon DB queries)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    const payload = JSON.parse(jsonPayload);
    userId = payload.sub;
  } catch (err: any) {
    return res.status(401).json({ error: 'Invalid Token structure.', details: err.message });
  }

  // 2. Initialize Supabase Client
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
    // 3. Fetch subscriptions for the active user
    const { data: subscriptions, error: dbError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId);

    if (dbError) {
      console.error('[TEST PUSH] Database query error:', dbError);
      return res.status(500).json({ error: 'Database query failed.', details: dbError });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(400).json({ error: 'No push subscriptions found for this device. Please toggle push notifications in Settings first.' });
    }

    // 4. Initialize web-push
    const publicVapidKey = process.env.VITE_WEB_PUSH_PUBLIC_KEY;
    const privateVapidKey = process.env.WEB_PUSH_PRIVATE_KEY;

    if (!publicVapidKey || !privateVapidKey) {
      return res.status(500).json({ error: 'Server VAPID credentials config missing.' });
    }

    webpush.setVapidDetails(
      'mailto:support@zerolag.app',
      publicVapidKey,
      privateVapidKey
    );

    const payload = JSON.stringify({
      title: 'ZeroLag Test Alert ⚡',
      body: 'Awesome! Your push notifications are fully configured and working.',
      url: '/'
    });

    const sendPromises = subscriptions.map((subObj: any) => {
      return webpush.sendNotification(subObj.subscription, payload)
        .catch(err => {
          console.warn('[TEST PUSH] Failed to send to subscription:', err.message);
        });
    });

    await Promise.all(sendPromises);

    return res.status(200).json({ message: 'Test push notification successfully dispatched to your registered device(s)!' });
  } catch (error: any) {
    console.error('[TEST PUSH] Execution error:', error);
    return res.status(500).json({ error: 'Internal test push execution failed.', details: error.message });
  }
}
