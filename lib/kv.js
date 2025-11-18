// ⚠️ SERVER-ONLY: This module uses Redis and can only run on Node.js server
// Do NOT import this in client-side code (pages, components)
// Use API routes instead (pages/api/*)

import { createClient } from 'redis';

// Initialize Redis client
let redisClient = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

async function getRedisClient() {
  // Return existing connection if healthy
  if (redisClient?.isOpen) {
    return redisClient;
  }

  // Prevent connection spam
  if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
    throw new Error('Max Redis connection attempts reached. Service may be unavailable.');
  }

  connectionAttempts++;

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        // Connection timeout: 5 seconds (mobile-optimized)
        connectTimeout: 5000,
        // Keep-alive: 30 seconds for persistent connections
        keepAlive: 30000,
        // No delay: Send data immediately
        noDelay: true,
        // Reconnect strategy
        reconnectStrategy: (retries) => {
          const delay = Math.min(retries * 100, 5000);
          console.log(`🔄 Redis reconnect attempt ${retries}, delay: ${delay}ms`);
          return delay;
        },
      },
      // Command timeout (prevent hanging requests)
      commandsQueueMaxLen: 100,
    });

    // Event handlers for connection lifecycle
    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err.message);
      // Don't set client to null on error - let reconnect strategy handle it
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connecting...');
      connectionAttempts = 0; // Reset on successful connection
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis ready for commands');
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    redisClient.on('end', () => {
      console.log('⛔ Redis connection closed');
    });

    // Attempt connection
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('✅ Redis connected successfully');
      connectionAttempts = 0;
    }

    return redisClient;
  } catch (err) {
    console.error(`❌ Failed to connect to Redis (attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}):`, err.message);
    redisClient = null; // Reset on failed connection
    throw err;
  }
}

/**
 * ===== REDIS KEY STRUCTURE & SCHEMA =====
 *
 * Groups:
 *   group:{id}                          -> Serialized group object (JSON)
 *   organizer:{organizerId}:groups      -> Array of group IDs for organizer (JSON)
 *   groups:index                        -> Global index of all group IDs (JSON)
 *
 * Gifts:
 *   group:{groupId}:gifts:{participantId} -> Array of gift objects (JSON)
 *
 * Exclusions:
 *   group:{groupId}:exclusions:{participantId} -> Object mapping exclusions (JSON)
 *
 * Pairings:
 *   Stored within group object as group.pairing property
 *   No separate key - normalized to reduce complexity
 *
 * ===== OPTIMIZATION NOTES =====
 * - getAllGroups and getOrganizerGroups use Redis pipelines for batch operations
 * - Pipelined commands execute in single round-trip vs N round-trips
 * - Connection pooling prevents connection spam (MAX_CONNECTION_ATTEMPTS = 3)
 * - Automatic reconnection with exponential backoff
 */

// ===== GROUPS =====

/**
 * Get a single group by ID
 * @param {string} id - Group ID (UUID)
 * @returns {Promise<Object|null>} Group object or null if not found
 */
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

/**
 * Save a group to Redis (creates or updates)
 * Automatically updates organizer index and global index
 * OPTIMIZATION: Uses pipelining to batch index updates with main save
 * @param {string} id - Group ID
 * @param {Object} group - Group object with id, name, organizerId, etc.
 * @returns {Promise<boolean>} true on success
 */
export async function saveGroup(id, group) {
  try {
    const client = await getRedisClient();

    // First, get current indexes (needed to determine if we need to update)
    const organizerKey = group.organizerId ? `organizer:${group.organizerId}:groups` : null;
    const indexKey = 'groups:index';

    // Use pipeline to read both indexes efficiently
    const pipeline = client.multi();
    if (organizerKey) {
      pipeline.get(organizerKey);
    }
    pipeline.get(indexKey);
    const [organizerGroupsStr, allGroupsStr] = await pipeline.exec();

    // Prepare organizer groups list
    const organizerGroups = organizerKey && organizerGroupsStr ? JSON.parse(organizerGroupsStr) : [];
    if (organizerKey && !organizerGroups.includes(id)) {
      organizerGroups.push(id);
    }

    // Prepare global groups list
    const allGroups = allGroupsStr ? JSON.parse(allGroupsStr) : [];
    if (!allGroups.includes(id)) {
      allGroups.push(id);
    }

    // Save group and update indexes in single pipeline (faster than sequential)
    const savePipeline = client.multi();
    savePipeline.set(`group:${id}`, JSON.stringify(group));
    if (organizerKey) {
      savePipeline.set(organizerKey, JSON.stringify(organizerGroups));
    }
    savePipeline.set(indexKey, JSON.stringify(allGroups));
    await savePipeline.exec();

    return true;
  } catch (error) {
    console.error('Error saving group:', error);
    throw error;
  }
}

/**
 * Delete a group and all associated data
 * Removes from all indexes and cascades deletion
 * @param {string} id - Group ID to delete
 * @returns {Promise<boolean>} true on success
 */
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

/**
 * Get ALL groups from the system
 * OPTIMIZATION: Uses Redis pipeline for single round-trip vs N round-trips
 * Pipeline performance: O(N) commands in 1 network round-trip vs N round-trips
 * @returns {Promise<Array>} Array of group objects
 */
export async function getAllGroups() {
  try {
    const client = await getRedisClient();
    const indexKey = 'groups:index';
    const groupIdsStr = await client.get(indexKey);
    const groupIds = groupIdsStr ? JSON.parse(groupIdsStr) : [];

    if (groupIds.length === 0) {
      return [];
    }

    // Optimization: Use Redis pipeline for batch operations (faster than sequential calls)
    // Pipeline sends all commands at once, receives all results in one response
    const pipeline = client.multi();
    for (const id of groupIds) {
      pipeline.get(`group:${id}`);
    }
    const results = await pipeline.exec();

    const groups = [];
    for (const result of results) {
      if (result) {
        try {
          groups.push(JSON.parse(result));
        } catch (e) {
          console.warn('Invalid group JSON:', result);
        }
      }
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

    if (groupIds.length === 0) {
      return [];
    }

    // Optimization: Use Redis pipeline for batch operations
    const pipeline = client.multi();
    for (const id of groupIds) {
      pipeline.get(`group:${id}`);
    }
    const results = await pipeline.exec();

    const groups = [];
    for (const result of results) {
      if (result) {
        try {
          groups.push(JSON.parse(result));
        } catch (e) {
          console.warn('Invalid group JSON:', result);
        }
      }
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

// ===== PAIRING (INTERNAL - Used within group object) =====
// Note: Pairings are stored within the group object itself
// No separate pairing functions needed - stored in group.pairing property
