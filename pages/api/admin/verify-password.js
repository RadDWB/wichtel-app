export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  // Get password from environment variables at RUNTIME (not build time)
  const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

  if (!correctPassword) {
    // If no password is configured, deny access
    return res.status(500).json({ error: 'Admin password not configured' });
  }

  if (password === correctPassword) {
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ error: 'Invalid password' });
}
