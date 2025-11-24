import { getGroup, saveGroup } from '../../../../../../lib/kv';

export default async function handler(req, res) {
  const { id, participantId } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const group = await getGroup(id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Find the participant
    const participant = group.participants?.find(p => p.id === participantId);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    // Mark participant as joined by setting a joined timestamp
    // This makes them visible in the organizer dashboard regardless of PIN status
    participant.joinedAt = new Date().toISOString();

    // Save updated group
    await saveGroup(id, group);

    return res.status(200).json({
      success: true,
      message: 'Participant marked as joined',
      participant: {
        id: participant.id,
        name: participant.name,
        joinedAt: participant.joinedAt
      }
    });
  } catch (error) {
    console.error('Error marking participant as joined:', error);
    return res.status(500).json({ error: 'Failed to mark participant as joined' });
  }
}
