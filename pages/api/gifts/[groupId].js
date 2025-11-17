import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const { groupId } = req.query;
  const { participantId } = req.body || req.query;

  if (!participantId) {
    return res.status(400).json({ error: 'participantId required' });
  }

  if (req.method === 'GET') {
    try {
      const gifts = await kv.get(`group:${groupId}:gifts:${participantId}`);
      return res.status(200).json({ gifts: gifts || [] });
    } catch (error) {
      console.error('Error fetching gifts:', error);
      return res.status(500).json({ error: 'Failed to fetch gifts' });
    }
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const { gifts } = req.body;

      if (!Array.isArray(gifts)) {
        return res.status(400).json({ error: 'gifts must be an array' });
      }

      // Limit to 10 gifts
      if (gifts.length > 10) {
        return res.status(400).json({ error: 'Maximum 10 gifts allowed' });
      }

      await kv.set(`group:${groupId}:gifts:${participantId}`, gifts);
      return res.status(200).json({ gifts });
    } catch (error) {
      console.error('Error saving gifts:', error);
      return res.status(500).json({ error: 'Failed to save gifts' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
