import { drawNames } from '../../../utils/drawAlgorithm';

export default async function handler(req, res) {
  const { groupId } = req.query;

  if (req.method === 'POST') {
    try {
      let group = null;
      let fromKV = false;

      // Try to load from KV first
      try {
        const { getGroup } = require('../../../lib/kv');
        group = await getGroup(groupId);
        fromKV = true;
        console.log('✅ Group loaded from KV');
      } catch (kvErr) {
        console.warn('⚠️ KV not available, trying fallback:', kvErr.message);
        // NOTE: In development or without KV setup, the client must have already saved the group
        // We cannot retrieve it server-side without KV
        group = null;
      }

      if (!group) {
        return res.status(400).json({
          error: 'Group not found. KV may not be configured. Please ensure group data is saved before drawing.',
          hint: 'This is a known limitation without Vercel KV configured. Contact support if this persists.',
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

      if (!pairing || Object.keys(pairing).length === 0) {
        return res.status(500).json({
          error: 'Draw failed: Could not generate valid pairings. Check exclusions or participant count.'
        });
      }

      // Save the updated group
      const updated = {
        ...group,
        drawn: true,
        pairing,
        drawnAt: new Date().toISOString(),
      };

      // Try to save to KV
      try {
        const { saveGroup } = require('../../../lib/kv');
        await saveGroup(groupId, updated);
        console.log('✅ Updated group saved to KV');
      } catch (kvErr) {
        console.warn('⚠️ Could not save to KV:', kvErr.message);
        // Still return success because the client will save it locally
      }

      // Generate mode-aware share link
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `http://localhost:${process.env.PORT || 3000}`;

      const isPublic = group.settings?.pairingVisibility === 'public';

      let pairingsShareLink;
      if (isPublic) {
        // VAR 1 & 3 (Public): Public pairings page - everyone can view
        pairingsShareLink = `${baseUrl}/${groupId}/pairings`;
      } else {
        // VAR 2 & 4 (Private): Participant join page - TN melden sich an
        pairingsShareLink = `${baseUrl}/join/${groupId}`;
      }

      return res.status(200).json({
        success: true,
        message: 'Draw completed successfully',
        drawn: true,
        pairing,
        pairingsShareLink,
        group: updated, // Return full group so client can save it
      });
    } catch (error) {
      console.error('❌ Error performing draw:', error);
      return res.status(500).json({
        error: error.message || 'Failed to perform draw. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
