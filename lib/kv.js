// ⚠️ SERVER-ONLY: This module uses Redis and can only run on Node.js server
// Do NOT import this in client-side code (pages, components)
// Use API routes instead (pages/api/*)

import { createClient } from 'redis';

// Initialize Redis client
let redisClient = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        // Connection timeout: 5 seconds (reduced from default 30s for mobile)
        connectTimeout: 5000,
        // Keep-alive: 30 seconds (maintain persistent connections)
        keepAlive: 30000,
        // No delay: Send data immediately
        noDelay: true,
      },
      // Retry strategy for connection failures
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis ready');
    });

    if (!redisClient.isOpen) {
      try {
        await redisClient.connect();
        console.log('✅ Redis connected successfully');
      } catch (err) {
        console.error('Failed to connect to Redis:', err);
        throw err;
      }
    }
  }
  return redisClient;
}

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
    const client = await getRedisClient();
    const group = await client.get(`group:${id}`);
    return group ? JSON.parse(group) : null;
  } catch (error) {
    console.error('Error getting group:', error);
    throw error;
  }
}

export async function saveGroup(id, group) {
  try {
    const client = await getRedisClient();
    await client.set(`group:${id}`, JSON.stringify(group));

    // Add to organizer's group list
    if (group.organizerId) {
      const organizerKey = `organizer:${group.organizerId}:groups`;
      const groupsStr = await client.get(organizerKey);
      const groups = groupsStr ? JSON.parse(groupsStr) : [];
      if (!groups.includes(id)) {
        groups.push(id);
        await client.set(organizerKey, JSON.stringify(groups));
      }
    }

    // Add to global index
    const indexKey = 'groups:index';
    const allGroupsStr = await client.get(indexKey);
    const allGroups = allGroupsStr ? JSON.parse(allGroupsStr) : [];
    if (!allGroups.includes(id)) {
      allGroups.push(id);
      await client.set(indexKey, JSON.stringify(allGroups));
    }

    return true;
  } catch (error) {
    console.error('Error saving group:', error);
    throw error;
  }
}

export async function deleteGroup(id) {
  try {
    const client = await getRedisClient();
    const group = await getGroup(id);
    await client.del(`group:${id}`);

    // Remove from organizer's group list
    if (group?.organizerId) {
      const organizerKey = `organizer:${group.organizerId}:groups`;
      const groupsStr = await client.get(organizerKey);
      const groups = groupsStr ? JSON.parse(groupsStr) : [];
      const filtered = groups.filter(g => g !== id);
      await client.set(organizerKey, JSON.stringify(filtered));
    }

    // Remove from global index
    const indexKey = 'groups:index';
    const allGroupsStr = await client.get(indexKey);
    const allGroups = allGroupsStr ? JSON.parse(allGroupsStr) : [];
    const filtered = allGroups.filter(g => g !== id);
    await client.set(indexKey, JSON.stringify(filtered));

    return true;
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
}

export async function getAllGroups() {
  try {
    const client = await getRedisClient();
    const indexKey = 'groups:index';
    const groupIdsStr = await client.get(indexKey);
    const groupIds = groupIdsStr ? JSON.parse(groupIdsStr) : [];
    const groups = [];

    for (const id of groupIds) {
      const group = await getGroup(id);
      if (group) groups.push(group);
    }

    return groups;
  } catch (error) {
    console.error('Error getting all groups:', error);
    throw error;
  }
}

export async function getOrganizerGroups(organizerId) {
  try {
    const client = await getRedisClient();
    const key = `organizer:${organizerId}:groups`;
    const groupIdsStr = await client.get(key);
    const groupIds = groupIdsStr ? JSON.parse(groupIdsStr) : [];
    const groups = [];

    for (const id of groupIds) {
      const group = await getGroup(id);
      if (group) groups.push(group);
    }

    return groups;
  } catch (error) {
    console.error('Error getting organizer groups:', error);
    throw error;
  }
}

// ===== GIFTS =====
export async function getGifts(groupId, participantId) {
  try {
    const client = await getRedisClient();
    const gifts = await client.get(`group:${groupId}:gifts:${participantId}`);
    return gifts ? JSON.parse(gifts) : [];
  } catch (error) {
    console.error('Error getting gifts:', error);
    return [];
  }
}

export async function saveGifts(groupId, participantId, gifts) {
  try {
    const client = await getRedisClient();
    await client.set(`group:${groupId}:gifts:${participantId}`, JSON.stringify(gifts));
    return true;
  } catch (error) {
    console.error('Error saving gifts:', error);
    throw error;
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
    const client = await getRedisClient();
    const exclusions = await client.get(`group:${groupId}:exclusions:${participantId}`);
    return exclusions ? JSON.parse(exclusions) : {};
  } catch (error) {
    console.error('Error getting exclusions:', error);
    return {};
  }
}

export async function saveExclusions(groupId, participantId, exclusions) {
  try {
    const client = await getRedisClient();
    await client.set(`group:${groupId}:exclusions:${participantId}`, JSON.stringify(exclusions));
    return true;
  } catch (error) {
    console.error('Error saving exclusions:', error);
    throw error;
  }
}

// ===== PAIRING =====
export async function getPairing(groupId) {
  try {
    const client = await getRedisClient();
    const pairing = await client.get(`group:${groupId}:pairing`);
    return pairing ? JSON.parse(pairing) : null;
  } catch (error) {
    console.error('Error getting pairing:', error);
    return null;
  }
}

export async function savePairing(groupId, pairing) {
  try {
    const client = await getRedisClient();
    await client.set(`group:${groupId}:pairing`, JSON.stringify(pairing));
    return true;
  } catch (error) {
    console.error('Error saving pairing:', error);
    throw error;
  }
}
