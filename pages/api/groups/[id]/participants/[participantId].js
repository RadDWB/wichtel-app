import { getGroup, saveGroup } from '../../../../../lib/kv';

export default async function handler(req, res) {
  const { id, participantId } = req.query;

  if (req.method === 'DELETE') {
    try {
      // Get the group
      const group = await getGroup(id);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Check if already drawn - can't delete after draw
      if (group.drawn) {
        return res.status(400).json({ error: 'Cannot delete participants after draw' });
      }

      // Find and remove the participant
      const initialLength = group.participants.length;
      group.participants = group.participants.filter(p => p.id !== participantId);

      // Check if participant was actually removed
      if (group.participants.length === initialLength) {
        return res.status(404).json({ error: 'Participant not found' });
      }

      // Save updated group
      await saveGroup(id, group);

      return res.status(200).json({
        success: true,
        message: 'Participant removed successfully',
        remainingParticipants: group.participants.length
      });
    } catch (error) {
      console.error('Error removing participant:', error);
      return res.status(500).json({ error: 'Failed to remove participant' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
