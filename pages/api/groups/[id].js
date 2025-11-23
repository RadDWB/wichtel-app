import { getGroup, saveGroup } from '../../../lib/kv';

const getCookies = (req) => {
  const header = req.headers?.cookie;
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map((c) => {
      const [k, v] = c.trim().split('=');
      return [k, decodeURIComponent(v || '')];
    })
  );
};

const logSession = (phase, req, extra = {}) => {
  const cookies = getCookies(req);
  const sessionId = cookies.sessionId || req.headers['x-session-id'] || null;
  console.log(
    `[session-debug] phase=${phase} route=${req.url} method=${req.method} sessionId=${sessionId || 'none'} cookies=${JSON.stringify(
      cookies
    )} extra=${JSON.stringify(extra)}`
  );
  return sessionId;
};

export default async function handler(req, res) {
  const { id } = req.query;
  const sessionId = logSession('groups/[id]:entry', req, { id });

  if (req.method === 'GET') {
    try {
      logSession('groups/[id]:before-getGroup', req, { id, sessionId });
      const group = await getGroup(id);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      logSession('groups/[id]:after-getGroup', req, { id, sessionId, found: !!group });
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

      logSession('groups/[id]:before-saveGroup', req, { id, sessionId });
      await saveGroup(id, group);
      logSession('groups/[id]:after-saveGroup', req, { id, sessionId });
      return res.status(200).json(group);
    } catch (error) {
      console.error('Error saving group:', error);
      return res.status(500).json({ error: 'Failed to save group' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
