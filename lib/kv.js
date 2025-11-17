import { kv } from '@vercel/kv';

// Keys structure:
// group:{id} -> group object
// group:{id}:gifts:{participantId} -> gifts array
// group:{id}:exclusions:{participantId} -> exclusions array
// group:{id}:pairing -> pairing data
// organizer:{organizerId}:groups -> list of group IDs
// groups:index -> list of all group IDs

// ===== GROUPS =====
export async function getGroup(id) {
  try {
    const group = await kv.get(`group:${id}`);
    return group;
  } catch (error) {
    console.error('Error getting group:', error);
    return null;
  }
}

export async function saveGroup(id, group) {
  try {
    await kv.set(`group:${id}`, group);

    // Add to organizer's group list
    if (group.organizerId) {
      const organizerKey = `organizer:${group.organizerId}:groups`;
      const groups = await kv.get(organizerKey) || [];
      if (!groups.includes(id)) {
        groups.push(id);
        await kv.set(organizerKey, groups);
      }
    }

    // Add to global index
    const indexKey = 'groups:index';
    const allGroups = await kv.get(indexKey) || [];
    if (!allGroups.includes(id)) {
      allGroups.push(id);
      await kv.set(indexKey, allGroups);
    }

    return true;
  } catch (error) {
    console.error('Error saving group:', error);
    return false;
  }
}

export async function deleteGroup(id) {
  try {
    const group = await kv.get(`group:${id}`);
    await kv.del(`group:${id}`);

    // Remove from organizer's group list
    if (group?.organizerId) {
      const organizerKey = `organizer:${group.organizerId}:groups`;
      const groups = await kv.get(organizerKey) || [];
      const filtered = groups.filter(g => g !== id);
      await kv.set(organizerKey, filtered);
    }

    // Remove from global index
    const indexKey = 'groups:index';
    const allGroups = await kv.get(indexKey) || [];
    const filtered = allGroups.filter(g => g !== id);
    await kv.set(indexKey, filtered);

    return true;
  } catch (error) {
    console.error('Error deleting group:', error);
    return false;
  }
}

export async function getAllGroups() {
  try {
    const indexKey = 'groups:index';
    const groupIds = await kv.get(indexKey) || [];
    const groups = [];

    for (const id of groupIds) {
      const group = await kv.get(`group:${id}`);
      if (group) groups.push(group);
    }

    return groups;
  } catch (error) {
    console.error('Error getting all groups:', error);
    return [];
  }
}

export async function getOrganizerGroups(organizerId) {
  try {
    const key = `organizer:${organizerId}:groups`;
    const groupIds = await kv.get(key) || [];
    const groups = [];

    for (const id of groupIds) {
      const group = await kv.get(`group:${id}`);
      if (group) groups.push(group);
    }

    return groups;
  } catch (error) {
    console.error('Error getting organizer groups:', error);
    return [];
  }
}

// ===== GIFTS =====
export async function getGifts(groupId, participantId) {
  try {
    const gifts = await kv.get(`group:${groupId}:gifts:${participantId}`);
    return gifts || [];
  } catch (error) {
    console.error('Error getting gifts:', error);
    return [];
  }
}

export async function saveGifts(groupId, participantId, gifts) {
  try {
    await kv.set(`group:${groupId}:gifts:${participantId}`, gifts);
    return true;
  } catch (error) {
    console.error('Error saving gifts:', error);
    return false;
  }
}

// Legacy function name for compatibility
export async function saveWishlist(groupId, participantId, wishlist) {
  return saveGifts(groupId, participantId, wishlist);
}

export async function getWishlist(groupId, participantId) {
  return getGifts(groupId, participantId);
}

// ===== EXCLUSIONS =====
export async function getExclusions(groupId, participantId) {
  try {
    const exclusions = await kv.get(`group:${groupId}:exclusions:${participantId}`);
    return exclusions || {};
  } catch (error) {
    console.error('Error getting exclusions:', error);
    return {};
  }
}

export async function saveExclusions(groupId, participantId, exclusions) {
  try {
    await kv.set(`group:${groupId}:exclusions:${participantId}`, exclusions);
    return true;
  } catch (error) {
    console.error('Error saving exclusions:', error);
    return false;
  }
}

// ===== PAIRING =====
export async function getPairing(groupId) {
  try {
    const pairing = await kv.get(`group:${groupId}:pairing`);
    return pairing || null;
  } catch (error) {
    console.error('Error getting pairing:', error);
    return null;
  }
}

export async function savePairing(groupId, pairing) {
  try {
    await kv.set(`group:${groupId}:pairing`, pairing);
    return true;
  } catch (error) {
    console.error('Error saving pairing:', error);
    return false;
  }
}
