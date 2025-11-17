// CLIENT-SIDE wrapper for KV functions
// These functions call API routes instead of accessing Redis directly
// Redis can only be accessed server-side

export async function getGroup(id) {
  try {
    const response = await fetch(`/api/groups/list?groupId=${id}`);
    if (!response.ok) {
      console.error('Failed to get group:', response.statusText);
      return null;
    }
    const data = await response.json();
    return data.groups && data.groups.length > 0 ? data.groups[0] : null;
  } catch (error) {
    console.error('Error getting group:', error);
    return null;
  }
}

export async function saveGroup(id, group) {
  try {
    const response = await fetch('/api/groups/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save group');
    }

    return true;
  } catch (error) {
    console.error('Error saving group:', error);
    throw error;
  }
}

export async function getGifts(groupId, participantId) {
  try {
    const response = await fetch(`/api/gifts/${groupId}?participantId=${participantId}`);
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data.gifts || [];
  } catch (error) {
    console.warn('Error getting gifts:', error);
    return [];
  }
}

export async function saveGifts(groupId, participantId, gifts) {
  try {
    const response = await fetch(`/api/gifts/${groupId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, gifts }),
    });

    if (!response.ok) {
      throw new Error('Failed to save gifts');
    }

    return true;
  } catch (error) {
    console.error('Error saving gifts:', error);
    throw error;
  }
}

export async function getExclusions(groupId, participantId) {
  try {
    const response = await fetch(`/api/groups/list?groupId=${groupId}`);
    if (!response.ok) {
      return {};
    }
    const data = await response.json();
    const group = data.groups && data.groups.length > 0 ? data.groups[0] : null;
    return group?.exclusions || {};
  } catch (error) {
    console.error('Error getting exclusions:', error);
    return {};
  }
}

export async function saveExclusions(groupId, participantId, exclusions) {
  try {
    const group = await getGroup(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const updated = { ...group, exclusions };
    await saveGroup(groupId, updated);
    return true;
  } catch (error) {
    console.error('Error saving exclusions:', error);
    throw error;
  }
}

// Legacy compatibility
export async function saveWishlist(groupId, participantId, wishlist) {
  return saveGifts(groupId, participantId, wishlist);
}

export async function getWishlist(groupId, participantId) {
  return getGifts(groupId, participantId);
}
