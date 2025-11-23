// List all groups or filter by organizerId/PIN
// This allows organizers to find their groups

import { getGroup, getOrganizerGroups, getAllGroups, deleteGroup } from '../../../lib/kv';

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

// In-memory fallback for development
const groupsStore = {};
const groupIndexStore = {}; // organizer -> [groupIds]

export default async function handler(req, res) {
  const sessionId = logSession('groups/list:entry', req, req.query);

  if (req.method === 'GET') {
    try {
      const { organizerId, pin, groupId } = req.query;

      // If groupId provided, fetch specific group
      if (groupId) {
        logSession('groups/list:before-getGroup', req, { groupId, sessionId });
        const group = await getGroup(groupId);
        if (group) {
          logSession('groups/list:after-getGroup', req, { groupId, sessionId, found: true });
          return res.status(200).json({ groups: [group] });
        } else {
          logSession('groups/list:after-getGroup', req, { groupId, sessionId, found: false });
          return res.status(404).json({ groups: [], error: 'Group not found' });
        }
      }

      // If both organizerId and PIN provided, validate access
      if (organizerId && pin) {
        logSession('groups/list:before-getOrganizerGroups', req, { organizerId, sessionId });
        const groups = await getOrganizerGroups(organizerId);
        // Filter by PIN
        const accessibleGroups = groups.filter(g => g.organizerPin === pin);
        logSession('groups/list:after-getOrganizerGroups', req, {
          organizerId,
          sessionId,
          total: groups.length,
          accessible: accessibleGroups.length
        });
        return res.status(200).json({ groups: accessibleGroups });
      }

      // Otherwise return all groups (admin/public view)
      logSession('groups/list:before-getAllGroups', req, { sessionId });
      const allGroups = await getAllGroups();
      logSession('groups/list:after-getAllGroups', req, { sessionId, total: allGroups.length });
      return res.status(200).json({ groups: allGroups });
    } catch (error) {
      console.error('Error listing groups:', error);
      return res.status(500).json({ error: 'Failed to list groups' });
    }
  }

  // POST: Save a new group
  if (req.method === 'POST') {
    try {
      const { group } = req.body;

      if (!group || !group.id) {
        return res.status(400).json({ error: 'Group with id required' });
      }

      // Import KV function
      const { saveGroup } = await import('../../../lib/kv');
      await saveGroup(group.id, group);

      return res.status(200).json({ success: true, group });
    } catch (error) {
      console.error('Error saving group:', error);
      return res.status(500).json({ error: 'Failed to save group' });
    }
  }

  // DELETE: Delete a group
  if (req.method === 'DELETE') {
    try {
      const { groupId } = req.query;

      if (!groupId) {
        return res.status(400).json({ error: 'groupId required' });
      }

      logSession('groups/list:before-deleteGroup', req, { groupId, sessionId });
      await deleteGroup(groupId);
      logSession('groups/list:after-deleteGroup', req, { groupId, sessionId });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting group:', error);
      return res.status(500).json({ error: 'Failed to delete group' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
