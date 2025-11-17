import { getWishlist, saveWishlist } from '../../../lib/kv';

export default async function handler(req, res) {
  const { groupId } = req.query;
  const { participantId } = req.body || req.query;

  if (!participantId) {
    return res.status(400).json({ error: 'participantId required' });
  }

  if (req.method === 'GET') {
    try {
      const wishlist = await getWishlist(groupId, participantId);
      return res.status(200).json({ wishlist });
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const { wishlist } = req.body;

      if (!Array.isArray(wishlist)) {
        return res.status(400).json({ error: 'wishlist must be an array' });
      }

      await saveWishlist(groupId, participantId, wishlist);
      return res.status(200).json({ wishlist });
    } catch (error) {
      console.error('Error saving wishlist:', error);
      return res.status(500).json({ error: 'Failed to save wishlist' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
