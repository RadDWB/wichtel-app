// CLIENT-SIDE wrapper for KV functions
// These functions call API routes instead of accessing Redis directly
// Redis can only be accessed server-side

// Helper: Retry wrapper for network failures (important on mobile)
async function withRetry(fn, maxAttempts = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
}

export async function getGroup(id) {
  try {
    // Retry logic for unreliable mobile networks
    const response = await withRetry(
      () => fetch(`/api/groups/list?groupId=${id}`, { signal: AbortSignal.timeout(10000) }),
      2, // Max 2 retries on mobile
      1000 // 1s initial delay
    );
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
    const response = await withRetry(
      () => fetch('/api/groups/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group }),
        signal: AbortSignal.timeout(10000),
      }),
      2,
      1000
    );

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
    const response = await withRetry(
      () => fetch(`/api/gifts/${groupId}?participantId=${participantId}`, {
        signal: AbortSignal.timeout(10000),
      }),
      2,
      1000
    );
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
    const response = await withRetry(
      () => fetch(`/api/gifts/${groupId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, gifts }),
        signal: AbortSignal.timeout(10000),
      }),
      2,
      1000
    );

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
    const response = await withRetry(
      () => fetch(`/api/groups/list?groupId=${groupId}`, {
        signal: AbortSignal.timeout(10000),
      }),
      2,
      1000
    );
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

// Get all groups for admin dashboard
export async function getAllGroups() {
  try {
    const response = await withRetry(
      () => fetch('/api/groups/list', {
        signal: AbortSignal.timeout(15000), // Longer timeout for large requests
      }),
      2,
      1000
    );
    if (!response.ok) {
      console.error('Failed to get all groups:', response.statusText);
      return [];
    }
    const data = await response.json();
    return data.groups || [];
  } catch (error) {
    console.error('Error getting all groups:', error);
    return [];
  }
}

// Delete a group
export async function deleteGroup(id) {
  try {
    const response = await withRetry(
      () => fetch(`/api/groups/list?groupId=${id}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(10000),
      }),
      2,
      1000
    );

    if (!response.ok) {
      throw new Error('Failed to delete group');
    }

    return true;
  } catch (error) {
    console.error('Error deleting group:', error);
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
