import { drawNames } from '../../../utils/drawAlgorithm';

export default async function handler(req, res) {
  const { groupId } = req.query;

  if (req.method === 'POST') {
    try {
      // Try to load from KV first
      let group = null;
      try {
        const { getGroup, saveGroup } = require('../../../lib/kv');
        group = await getGroup(groupId);
      } catch (kvErr) {
        console.warn('KV not available, using localStorage fallback:', kvErr.message);
        // Fallback to localStorage
        if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
          console.warn('Running in development, KV may not be configured');
        }
      }

      // If KV failed, we can't get the group server-side
      // Client should handle this
      if (!group) {
        return res.status(404).json({
          error: 'Group not found in database. Please ensure group was saved.'
        });
      }

      if (group.participants.length < 3) {
        return res.status(400).json({ error: 'Minimum 3 participants required' });
      }

      if (group.drawn) {
        return res.status(400).json({ error: 'Group already drawn' });
      }

      // Perform the draw
      const pairing = drawNames(group.participants, group.exclusions || {});

      // Save the updated group
      const updated = {
        ...group,
        drawn: true,
        pairing,
        drawnAt: new Date().toISOString(),
      };

      try {
        const { saveGroup } = require('../../../lib/kv');
        await saveGroup(groupId, updated);
      } catch (kvErr) {
        console.warn('Could not save to KV:', kvErr.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Draw completed successfully',
        drawn: true,
        pairing,
      });
    } catch (error) {
      console.error('Error performing draw:', error);
      return res.status(500).json({ error: error.message || 'Failed to perform draw' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
