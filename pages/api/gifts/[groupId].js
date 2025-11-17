// Fallback in-memory storage for development
const giftStore = {};

export default async function handler(req, res) {
  const { groupId } = req.query;
  const { participantId } = req.body || req.query;

  if (!groupId) {
    return res.status(400).json({ error: 'groupId required' });
  }

  if (!participantId) {
    return res.status(400).json({ error: 'participantId required' });
  }

  const cacheKey = `group:${groupId}:gifts:${participantId}`;

  if (req.method === 'GET') {
    try {
      // Try to use Vercel KV if available
      let gifts = null;
      try {
        const { kv } = await import('@vercel/kv');
        if (kv) {
          gifts = await kv.get(cacheKey);
        }
      } catch (e) {
        console.log('KV not available, using fallback storage');
      }

      // Fallback to in-memory storage
      if (!gifts && giftStore[cacheKey]) {
        gifts = giftStore[cacheKey];
      }

      return res.status(200).json({ gifts: gifts || [] });
    } catch (error) {
      console.error('Error fetching gifts:', error);
      // Return fallback data
      return res.status(200).json({ gifts: giftStore[cacheKey] || [] });
    }
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const { gifts, participantId: bodyParticipantId } = req.body;
      const actualParticipantId = bodyParticipantId || participantId;

      if (!actualParticipantId) {
        return res.status(400).json({ error: 'participantId required' });
      }

      if (!Array.isArray(gifts)) {
        return res.status(400).json({ error: 'gifts must be an array' });
      }

      // Limit to 10 gifts
      if (gifts.length > 10) {
        return res.status(400).json({ error: 'Maximum 10 gifts allowed' });
      }

      // Create correct cache key with actual participant ID
      const correctCacheKey = `group:${groupId}:gifts:${actualParticipantId}`;

      // Save to in-memory fallback
      giftStore[correctCacheKey] = gifts;

      // Try to save to KV
      try {
        const { kv } = await import('@vercel/kv');
        if (kv) {
          await kv.set(correctCacheKey, gifts);
        }
      } catch (e) {
        console.log('KV not available, using fallback storage', e.message);
      }

      return res.status(200).json({ gifts });
    } catch (error) {
      console.error('Error saving gifts:', error);
      return res.status(500).json({ error: `Failed to save gifts: ${error.message}` });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
