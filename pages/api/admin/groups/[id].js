import { deleteGroup } from '../../../../lib/kv';
import { isValidAdminPassword } from '../../../../lib/admin';

function requireAdmin(req, res) {
  const authHeader = req.headers.authorization || '';
  const [scheme, encoded] = authHeader.split(' ');

  if (scheme !== 'Basic' || !encoded) {
    res.status(401).json({ error: 'Admin authentication required' });
    return null;
  }

  let decoded;
  try {
    decoded = Buffer.from(encoded, 'base64').toString('utf8');
  } catch {
    res.status(400).json({ error: 'Invalid Authorization header' });
    return null;
  }

  const [user, password] = decoded.split(':');
  if (user !== 'admin' || !password || !isValidAdminPassword(password)) {
    res.status(403).json({ error: 'Invalid admin credentials' });
    return null;
  }

  return { user };
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = requireAdmin(req, res);
  if (!admin) return;

  if (!id) {
    return res.status(400).json({ error: 'Group id required' });
  }

  try {
    await deleteGroup(id);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting group (admin):', error);
    return res.status(500).json({ error: 'Failed to delete group' });
  }
}

