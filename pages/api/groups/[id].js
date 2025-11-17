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
      const { name, budget, participants, exclusions, drawn, pairing, drawnAt } = req.body;

      const group = {
        id,
        name: name || 'Meine Wichtelrunde',
        budget: budget || '20 €',
        participants: participants || [],
        exclusions: exclusions || {},
        drawn: drawn || false,
        pairing: pairing || null,
        drawnAt: drawnAt || null,
        createdAt: new Date().toISOString(),
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
