// Verify organizer PIN server-side
// This endpoint ensures PIN validation happens on the server to prevent tampering

import { getGroup } from '../../../lib/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { groupId, pin } = req.body;

    if (!groupId || !pin) {
      return res.status(400).json({ error: 'groupId and pin required' });
    }

    // Fetch the group from KV store
    const group = await getGroup(groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Verify PIN against stored organizerPin
    if (group.organizerPin === pin.trim()) {
      return res.status(200).json({
        success: true,
        authenticated: true,
        groupId
      });
    } else {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'Invalid PIN'
      });
    }
  } catch (error) {
    console.error('Error verifying organizer PIN:', error);
    return res.status(500).json({ error: 'Failed to verify PIN' });
  }
}
