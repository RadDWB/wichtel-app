import { getGroup, saveGroup } from '../../../lib/kv';
import { drawNames } from '../../../utils/drawAlgorithm';

export default async function handler(req, res) {
  const { groupId } = req.query;

  if (req.method === 'POST') {
    try {
      const group = await getGroup(groupId);

      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
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

      await saveGroup(groupId, updated);

      return res.status(200).json({
        success: true,
        message: 'Draw completed successfully',
        drawn: true,
      });
    } catch (error) {
      console.error('Error performing draw:', error);
      return res.status(500).json({ error: error.message || 'Failed to perform draw' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
