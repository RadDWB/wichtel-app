import { getGroup, saveGroup } from '../../../lib/kv';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const group = await getGroup(id);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      return res.status(200).json(group);
    } catch (error) {
      console.error('Error fetching group:', error);
      return res.status(500).json({ error: 'Failed to fetch group' });
    }
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const group = {
        id,
        // Pass through all fields from request, with defaults for new groups
        name: req.body.name || 'Meine Wichtelrunde',
        occasion: req.body.occasion || 'other',
        budget: req.body.budget || '20 €',
        endDate: req.body.endDate || null,
        organizerName: req.body.organizerName || 'Organisator',
        organizerEmail: req.body.organizerEmail || null,
        participants: req.body.participants || [],
        exclusions: req.body.exclusions || {},
        drawn: req.body.drawn || false,
        pairing: req.body.pairing || null,
        drawnAt: req.body.drawnAt || null,
        isComplete: req.body.isComplete || false,
        invitationText: req.body.invitationText || null,
        createdAt: req.body.createdAt || new Date().toISOString(),
      };

      await saveGroup(id, group);
      return res.status(200).json(group);
    } catch (error) {
      console.error('Error saving group:', error);
      return res.status(500).json({ error: 'Failed to save group' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
