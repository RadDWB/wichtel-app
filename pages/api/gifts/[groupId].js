// In-memory storage fallback
const giftStore = {};

// Import saveGifts, getGifts from server-only lib/kv
// This is only loaded server-side in API routes
async function getGiftsFromRedis(groupId, participantId) {
  try {
    const { getGifts } = await import('../../../lib/kv');
    return await getGifts(groupId, participantId);
  } catch (error) {
    console.error('Error getting gifts from Redis:', error);
    return null;
  }
}

async function saveGiftsToRedis(groupId, participantId, gifts) {
  try {
    const { saveGifts } = await import('../../../lib/kv');
    return await saveGifts(groupId, participantId, gifts);
  } catch (error) {
    console.error('Error saving gifts to Redis:', error);
    return false;
  }
}

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
      // Try Redis first
      let gifts = await getGiftsFromRedis(groupId, participantId);

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

      // Try to save to Redis
      await saveGiftsToRedis(groupId, actualParticipantId, gifts);

      return res.status(200).json({ gifts });
    } catch (error) {
      console.error('Error saving gifts:', error);
      return res.status(500).json({ error: `Failed to save gifts: ${error.message}` });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
