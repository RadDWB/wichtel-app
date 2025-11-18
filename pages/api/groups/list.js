// List all groups or filter by organizerId/PIN
// This allows organizers to find their groups

import { getGroup, getOrganizerGroups, getAllGroups, deleteGroup } from '../../../lib/kv';

// In-memory fallback for development
const groupsStore = {};
const groupIndexStore = {}; // organizer -> [groupIds]

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { organizerId, pin, groupId } = req.query;

      // If groupId provided, fetch specific group
      if (groupId) {
        const group = await getGroup(groupId);
        if (group) {
          return res.status(200).json({ groups: [group] });
        } else {
          return res.status(404).json({ groups: [], error: 'Group not found' });
        }
      }

      // If both organizerId and PIN provided, validate access
      if (organizerId && pin) {
        const groups = await getOrganizerGroups(organizerId);
        // Filter by PIN
        const accessibleGroups = groups.filter(g => g.organizerPin === pin);
        return res.status(200).json({ groups: accessibleGroups });
      }

      // Otherwise return all groups (admin/public view)
      const allGroups = await getAllGroups();
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

      await deleteGroup(groupId);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting group:', error);
      return res.status(500).json({ error: 'Failed to delete group' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
